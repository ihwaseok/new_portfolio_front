'use strict';

type ReaderState = 'getting_codecs' | 'running' | 'restarting' | 'closed' | 'failed';
type WriterState = 'running' | 'restarting' | 'closed' | 'failed';

interface ReaderConf {
    url: string;
    jwt?: string;
    onError?: (err: string) => void;
    onTrack?: (evt: RTCTrackEvent) => void;
}

interface WriterConf {
    url: string;
    jwt?: string;
    stream: MediaStream;
    onError?: (err: string) => void;
    onConnected?: () => void;
}

interface OfferData {
    iceUfrag: string;
    icePwd: string;
    medias: string[];
}

interface IceServer {
    urls: string[];
    username?: string;
    credential?: string;
    credentialType?: string;
}

/** WHEP 방식으로 MediaMTX의 영상·음성 스트림을 수신합니다. */
class MediaMTXWebRTCReader {
    private retryPause: number;
    private retryCount: number;
    private conf: ReaderConf;
    private state: ReaderState;
    private restartTimeout: ReturnType<typeof setTimeout> | null;
    private pc: RTCPeerConnection | null;
    private offerData: OfferData | null;
    private sessionUrl: string | null;
    private queuedCandidates: RTCIceCandidate[];
    private nonAdvertisedCodecs: string[];

    constructor(conf: ReaderConf) {
        this.retryPause = 2000;
        this.retryCount = 0;
        this.conf = conf;
        this.state = 'getting_codecs';
        this.restartTimeout = null;
        this.pc = null;
        this.offerData = null;
        this.sessionUrl = null;
        this.queuedCandidates = [];
        this.nonAdvertisedCodecs = [];
        this.#getNonAdvertisedCodecs();
    }

    // 미디어 연결과 재시도 예약을 종료합니다.
    close() {
        this.state = 'closed';
        this.pc?.close();
        if (this.restartTimeout !== null) clearTimeout(this.restartTimeout);
    }

    // 임시 SDP 협상으로 추가 오디오 코덱의 브라우저 지원 여부를 확인합니다.
    static #supportsNonAdvertisedCodec(codec: string, fmtp?: string): Promise<boolean> {
        return new Promise((resolve) => {
            const pc = new RTCPeerConnection({ iceServers: [] });
            const mediaType = 'audio';
            let payloadType = '';

            pc.addTransceiver(mediaType, { direction: 'recvonly' });
            pc.createOffer()
                .then((offer) => {
                    if (!offer.sdp) throw new Error('SDP not present');
                    if (offer.sdp.includes(` ${codec}`)) throw new Error('already present');

                    const sections = offer.sdp.split(`m=${mediaType}`);
                    const section1 = sections[1];
                    if (!section1) throw new Error('no media section');

                    const payloadTypes = sections
                        .slice(1)
                        .flatMap((s) => (s.split('\r\n')[0] ?? '').split(' ').slice(3));
                    payloadType = this.#reservePayloadType(payloadTypes);

                    const lines = section1.split('\r\n');
                    lines[0] = (lines[0] ?? '') + ` ${payloadType}`;
                    lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} ${codec}`);
                    if (fmtp !== undefined) {
                        lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} ${fmtp}`);
                    }
                    sections[1] = lines.join('\r\n');
                    offer.sdp = sections.join(`m=${mediaType}`);
                    return pc.setLocalDescription(offer);
                })
                .then(() =>
                    pc.setRemoteDescription(
                        new RTCSessionDescription({
                            type: 'answer',
                            sdp:
                                'v=0\r\n' +
                                'o=- 6539324223450680508 0 IN IP4 0.0.0.0\r\n' +
                                's=-\r\n' +
                                't=0 0\r\n' +
                                'a=fingerprint:sha-256 0D:9F:78:15:42:B5:4B:E6:E2:94:3E:5B:37:78:E1:4B:54:59:A3:36:3A:E5:05:EB:27:EE:8F:D2:2D:41:29:25\r\n' +
                                `m=${mediaType} 9 UDP/TLS/RTP/SAVPF ${payloadType}\r\n` +
                                'c=IN IP4 0.0.0.0\r\n' +
                                'a=ice-pwd:7c3bf4770007e7432ee4ea4d697db675\r\n' +
                                'a=ice-ufrag:29e036dc\r\n' +
                                'a=sendonly\r\n' +
                                'a=rtcp-mux\r\n' +
                                `a=rtpmap:${payloadType} ${codec}\r\n` +
                                (fmtp !== undefined ? `a=fmtp:${payloadType} ${fmtp}\r\n` : ''),
                        }),
                    ),
                )
                .then(() => {
                    resolve(true);
                })
                .catch(() => {
                    resolve(false);
                })
                .finally(() => {
                    pc.close();
                });
        });
    }

    // ICE 인증 정보의 따옴표 이스케이프를 해제합니다.
    static #unquoteCredential(v: string): string {
        return JSON.parse(`"${v}"`) as string;
    }

    // OPTIONS 응답의 Link 헤더에서 STUN·TURN 서버 설정을 추출합니다.
    static #linkToIceServers(links: string | null): IceServer[] {
        if (links === null) return [];

        return links.split(', ').map((link) => {
            const m = link.match(
                /^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i,
            );
            if (!m) return { urls: [] };

            const ret: IceServer = { urls: [m[1] ?? ''] };
            if (m[3] !== undefined) {
                ret.username = this.#unquoteCredential(m[3]);
                ret.credential = this.#unquoteCredential(m[4] ?? '');
                ret.credentialType = 'password';
            }
            return ret;
        });
    }

    // 추가 ICE 후보 전송에 필요한 인증 정보와 미디어 구성을 SDP에서 읽습니다.
    static #parseOffer(sdp: string): OfferData {
        const ret: OfferData = { iceUfrag: '', icePwd: '', medias: [] };

        for (const line of sdp.split('\r\n')) {
            if (line.startsWith('m=')) {
                ret.medias.push(line.slice('m='.length));
            } else if (ret.iceUfrag === '' && line.startsWith('a=ice-ufrag:')) {
                ret.iceUfrag = line.slice('a=ice-ufrag:'.length);
            } else if (ret.icePwd === '' && line.startsWith('a=ice-pwd:')) {
                ret.icePwd = line.slice('a=ice-pwd:'.length);
            }
        }

        return ret;
    }

    // 기존 코덱과 겹치지 않는 RTP 페이로드 번호를 확보합니다.
    static #reservePayloadType(payloadTypes: string[]): string {
        for (let i = 30; i <= 127; i++) {
            if ((i <= 63 || i >= 96) && !payloadTypes.includes(i.toString())) {
                const pl = i.toString();
                payloadTypes.push(pl);
                return pl;
            }
        }
        throw Error('unable to find a free payload type');
    }

    // PCMU·PCMA 스테레오 수신 정보를 SDP에 추가합니다.
    static #enableStereoPcmau(payloadTypes: string[], section: string): string {
        const lines = section.split('\r\n');

        let payloadType = this.#reservePayloadType(payloadTypes);
        lines[0] = (lines[0] ?? '') + ` ${payloadType}`;
        lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} PCMU/8000/2`);
        lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

        payloadType = this.#reservePayloadType(payloadTypes);
        lines[0] = (lines[0] ?? '') + ` ${payloadType}`;
        lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} PCMA/8000/2`);
        lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);

        return lines.join('\r\n');
    }

    // 다채널 Opus 코덱과 채널 매핑을 SDP에 추가합니다.
    static #enableMultichannelOpus(payloadTypes: string[], section: string): string {
        const lines = section.split('\r\n');

        const channels: [string, string][] = [
            ['multiopus/48000/3', 'channel_mapping=0,2,1;num_streams=2;coupled_streams=1'],
            ['multiopus/48000/4', 'channel_mapping=0,1,2,3;num_streams=2;coupled_streams=2'],
            ['multiopus/48000/5', 'channel_mapping=0,4,1,2,3;num_streams=3;coupled_streams=2'],
            ['multiopus/48000/6', 'channel_mapping=0,4,1,2,3,5;num_streams=4;coupled_streams=2'],
            ['multiopus/48000/7', 'channel_mapping=0,4,1,2,3,5,6;num_streams=4;coupled_streams=4'],
            [
                'multiopus/48000/8',
                'channel_mapping=0,6,1,4,5,2,3,7;num_streams=5;coupled_streams=4',
            ],
        ];

        for (const [codec, fmtp] of channels) {
            const payloadType = this.#reservePayloadType(payloadTypes);
            lines[0] = (lines[0] ?? '') + ` ${payloadType}`;
            lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} ${codec}`);
            lines.splice(lines.length - 1, 0, `a=fmtp:${payloadType} ${fmtp}`);
            lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);
        }

        return lines.join('\r\n');
    }

    // 샘플링 주파수별 L16 코덱 정보를 추가합니다.
    static #enableL16(payloadTypes: string[], section: string): string {
        const lines = section.split('\r\n');

        for (const codec of ['L16/8000/2', 'L16/16000/2', 'L16/48000/2']) {
            const payloadType = this.#reservePayloadType(payloadTypes);
            lines[0] = (lines[0] ?? '') + ` ${payloadType}`;
            lines.splice(lines.length - 1, 0, `a=rtpmap:${payloadType} ${codec}`);
            lines.splice(lines.length - 1, 0, `a=rtcp-fb:${payloadType} transport-cc`);
        }

        return lines.join('\r\n');
    }

    // 기존 Opus 설정에 스테레오 옵션을 보완합니다.
    static #enableStereoOpus(section: string): string {
        let opusPayloadFormat = '';
        const lines = section.split('\r\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i] ?? '';
            if (line.startsWith('a=rtpmap:') && line.toLowerCase().includes('opus/')) {
                opusPayloadFormat = line.slice('a=rtpmap:'.length).split(' ')[0] ?? '';
                break;
            }
        }

        if (opusPayloadFormat === '') return section;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i] ?? '';
            if (line.startsWith(`a=fmtp:${opusPayloadFormat} `)) {
                let updated = line;
                if (!updated.includes('stereo')) updated += ';stereo=1';
                if (!updated.includes('sprop-stereo')) updated += ';sprop-stereo=1';
                lines[i] = updated;
            }
        }

        return lines.join('\r\n');
    }

    // 지원 가능한 추가 오디오 코덱을 수신 제안에 반영합니다.
    static #editOffer(sdp: string, nonAdvertisedCodecs: string[]): string {
        const sections = sdp.split('m=');

        const payloadTypes = sections
            .slice(1)
            .flatMap((s) => (s.split('\r\n')[0] ?? '').split(' ').slice(3));

        for (let i = 1; i < sections.length; i++) {
            const section = sections[i] ?? '';
            if (section.startsWith('audio')) {
                let updated = this.#enableStereoOpus(section);

                if (nonAdvertisedCodecs.includes('pcma/8000/2')) {
                    updated = this.#enableStereoPcmau(payloadTypes, updated);
                }
                if (nonAdvertisedCodecs.includes('multiopus/48000/6')) {
                    updated = this.#enableMultichannelOpus(payloadTypes, updated);
                }
                if (nonAdvertisedCodecs.includes('L16/48000/2')) {
                    updated = this.#enableL16(payloadTypes, updated);
                }

                sections[i] = updated;
                break;
            }
        }

        return sections.join('m=');
    }

    // 미디어별 ICE 후보를 모아 PATCH 요청용 SDP 조각을 만듭니다.
    static #generateSdpFragment(od: OfferData, candidates: RTCIceCandidate[]): string {
        const candidatesByMedia: Record<number, RTCIceCandidate[]> = {};
        for (const candidate of candidates) {
            const mid = candidate.sdpMLineIndex ?? 0;
            if (!candidatesByMedia[mid]) candidatesByMedia[mid] = [];
            candidatesByMedia[mid]!.push(candidate);
        }

        let frag = `a=ice-ufrag:${od.iceUfrag}\r\n` + `a=ice-pwd:${od.icePwd}\r\n`;

        let mid = 0;
        for (const media of od.medias) {
            const group = candidatesByMedia[mid];
            if (group !== undefined) {
                frag += `m=${media}\r\n` + `a=mid:${mid}\r\n`;
                for (const candidate of group) {
                    frag += `a=${candidate.candidate ?? ''}\r\n`;
                }
            }
            mid++;
        }

        return frag;
    }

    // 실패한 세션을 정리하고 상태와 횟수에 따라 재연결을 예약합니다.
    #handleError(err: string) {
        if (this.state === 'running') {
            if (this.pc !== null) {
                this.pc.close();
                this.pc = null;
            }

            this.offerData = null;

            if (this.sessionUrl !== null) {
                fetch(this.sessionUrl, { method: 'DELETE' });
                this.sessionUrl = null;
            }

            this.queuedCandidates = [];
            this.state = 'restarting';

            if (this.retryCount < 3) {
                this.retryCount++;
                this.restartTimeout = window.setTimeout(() => {
                    this.restartTimeout = null;
                    this.state = 'running';
                    this.#start();
                }, this.retryPause);
            } else {
                this.retryCount = 0;
            }

            this.conf.onError?.(`${err}, retrying in some seconds`);
        } else if (this.state === 'getting_codecs') {
            this.state = 'failed';
            this.conf.onError?.(err);
        }
    }

    // 추가 오디오 코덱 검사를 마친 뒤 수신 연결을 시작합니다.
    #getNonAdvertisedCodecs() {
        Promise.all(
            [
                ['pcma/8000/2'],
                [
                    'multiopus/48000/6',
                    'channel_mapping=0,4,1,2,3,5;num_streams=4;coupled_streams=2',
                ],
                ['L16/48000/2'],
            ].map((c) =>
                MediaMTXWebRTCReader.#supportsNonAdvertisedCodec(c[0] ?? '', c[1]).then((r) =>
                    r ? (c[0] ?? '') : false,
                ),
            ),
        )
            .then((c) => c.filter((e): e is string => e !== false))
            .then((codecs) => {
                if (this.state !== 'getting_codecs') throw new Error('closed');
                this.nonAdvertisedCodecs = codecs;
                this.state = 'running';
                this.#start();
            })
            .catch((err: unknown) => {
                this.#handleError(String(err));
            });
    }

    // ICE 서버 조회부터 SDP 응답 적용까지 연결 협상을 진행합니다.
    #start() {
        this.#requestICEServers()
            .then((iceServers) => this.#setupPeerConnection(iceServers))
            .then((offer) => this.#sendOffer(offer))
            .then((answer) => this.#setAnswer(answer))
            .catch((err: unknown) => {
                this.#handleError(String(err));
            });
    }

    // 인증 정보를 포함한 OPTIONS 요청으로 ICE 서버를 조회합니다.
    #requestICEServers(): Promise<IceServer[]> {
        return fetch(this.conf.url, {
            method: 'OPTIONS',
            headers: { Authorization: `Bearer ${this.conf.jwt ?? ''}` },
        }).then((res) => MediaMTXWebRTCReader.#linkToIceServers(res.headers.get('Link')));
    }

    // 미디어 방향과 이벤트를 등록하고 로컬 SDP 제안을 생성합니다.
    #setupPeerConnection(iceServers: IceServer[]): Promise<string> {
        if (this.state !== 'running') throw new Error('closed');

        this.pc = new RTCPeerConnection({
            iceServers,
            // @ts-expect-error 표준 RTCConfiguration 타입에 없는 구형 호환 옵션입니다.
            sdpSemantics: 'unified-plan',
        });

        this.pc.addTransceiver('video', { direction: 'recvonly' });
        this.pc.addTransceiver('audio', { direction: 'recvonly' });
        this.pc.onicecandidate = (evt) => this.#onLocalCandidate(evt);
        this.pc.onconnectionstatechange = () => this.#onConnectionState();
        this.pc.ontrack = (evt) => this.#onTrack(evt);

        return this.pc.createOffer().then((offer) => {
            const rawSdp = offer.sdp;
            if (!rawSdp) throw new Error('SDP not present');

            const editedSdp = MediaMTXWebRTCReader.#editOffer(rawSdp, this.nonAdvertisedCodecs);
            offer.sdp = editedSdp;
            this.offerData = MediaMTXWebRTCReader.#parseOffer(editedSdp);
            return this.pc!.setLocalDescription(offer).then(() => editedSdp);
        });
    }

    // SDP 제안을 전송하고 후속 요청에 사용할 세션 주소를 보관합니다.
    #sendOffer(offer: string): Promise<string> {
        if (this.state !== 'running') throw new Error('closed');

        return fetch(this.conf.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/sdp',
                Authorization: `Bearer ${this.conf.jwt ?? ''}`,
            },
            body: offer,
        }).then((res) => {
            switch (res.status) {
                case 201:
                    break;
                case 404:
                    throw new Error('stream not found');
                case 400:
                    return res.json().then((e: { error: string }) => {
                        throw new Error(e.error);
                    });
                default:
                    throw new Error(`bad status code ${res.status}`);
            }
            this.sessionUrl = new URL(res.headers.get('location') ?? '', this.conf.url).toString();
            return res.text();
        });
    }

    // 서버 SDP 응답을 적용하고 대기 중인 ICE 후보를 전송합니다.
    #setAnswer(answer: string): Promise<void> {
        if (this.state !== 'running') throw new Error('closed');

        return this.pc!.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: answer }),
        ).then(() => {
            if (this.state !== 'running') return;
            if (this.queuedCandidates.length !== 0) {
                this.#sendLocalCandidates(this.queuedCandidates);
                this.queuedCandidates = [];
            }
        });
    }

    // 세션 주소가 준비되기 전의 ICE 후보는 대기열에 저장합니다.
    #onLocalCandidate(evt: RTCPeerConnectionIceEvent) {
        if (this.state !== 'running') return;
        if (evt.candidate !== null) {
            if (this.sessionUrl === null) {
                this.queuedCandidates.push(evt.candidate);
            } else {
                this.#sendLocalCandidates([evt.candidate]);
            }
        }
    }

    // Trickle ICE 방식으로 연결 경로 후보를 추가 전송합니다.
    #sendLocalCandidates(candidates: RTCIceCandidate[]) {
        fetch(this.sessionUrl!, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/trickle-ice-sdpfrag',
                'If-Match': '*',
            },
            body: MediaMTXWebRTCReader.#generateSdpFragment(this.offerData!, candidates),
        })
            .then((res) => {
                switch (res.status) {
                    case 204:
                        break;
                    case 404:
                        throw new Error('stream not found');
                    default:
                        throw new Error(`bad status code ${res.status}`);
                }
            })
            .catch((err: unknown) => {
                this.#handleError(String(err));
            });
    }

    // 연결 실패·종료를 감지하여 오류 처리 흐름으로 넘깁니다.
    #onConnectionState() {
        if (this.state !== 'running') return;
        if (this.pc!.connectionState === 'failed' || this.pc!.connectionState === 'closed') {
            this.#handleError('peer connection closed');
        }
    }

    // 수신한 미디어 트랙을 화면의 처리 함수에 전달합니다.
    #onTrack(evt: RTCTrackEvent) {
        this.conf.onTrack?.(evt);
    }
}

/** WebRTC/WHIP writer - 웹캠 영상을 MediaMTX로 송신 */
class MediaMTXWebRTCWriter {
    private retryPause: number;
    private retryCount: number;
    private conf: WriterConf;
    private state: WriterState;
    private restartTimeout: ReturnType<typeof setTimeout> | null;
    private pc: RTCPeerConnection | null;
    private offerData: OfferData | null;
    private sessionUrl: string | null;
    private queuedCandidates: RTCIceCandidate[];

    constructor(conf: WriterConf) {
        this.retryPause = 2000;
        this.retryCount = 0;
        this.conf = conf;
        this.state = 'running';
        this.restartTimeout = null;
        this.pc = null;
        this.offerData = null;
        this.sessionUrl = null;
        this.queuedCandidates = [];
        this.#start();
    }

    // 미디어 연결과 재시도 예약을 종료합니다.
    close() {
        this.state = 'closed';

        if (this.pc !== null) {
            this.pc.close();
            this.pc = null;
        }

        if (this.restartTimeout !== null) clearTimeout(this.restartTimeout);

        if (this.sessionUrl !== null) {
            fetch(this.sessionUrl, { method: 'DELETE' });
            this.sessionUrl = null;
        }
    }

    // ICE 인증 정보의 따옴표 이스케이프를 해제합니다.
    static #unquoteCredential(v: string): string {
        return JSON.parse(`"${v}"`) as string;
    }

    // OPTIONS 응답의 Link 헤더에서 STUN·TURN 서버 설정을 추출합니다.
    static #linkToIceServers(links: string | null): IceServer[] {
        if (links === null) return [];

        return links.split(', ').map((link) => {
            const m = link.match(
                /^<(.+?)>; rel="ice-server"(; username="(.*?)"; credential="(.*?)"; credential-type="password")?/i,
            );
            if (!m) return { urls: [] };

            const ret: IceServer = { urls: [m[1] ?? ''] };
            if (m[3] !== undefined) {
                ret.username = this.#unquoteCredential(m[3]);
                ret.credential = this.#unquoteCredential(m[4] ?? '');
                ret.credentialType = 'password';
            }
            return ret;
        });
    }

    // 추가 ICE 후보 전송에 필요한 인증 정보와 미디어 구성을 SDP에서 읽습니다.
    static #parseOffer(sdp: string): OfferData {
        const ret: OfferData = { iceUfrag: '', icePwd: '', medias: [] };

        for (const line of sdp.split('\r\n')) {
            if (line.startsWith('m=')) {
                ret.medias.push(line.slice('m='.length));
            } else if (ret.iceUfrag === '' && line.startsWith('a=ice-ufrag:')) {
                ret.iceUfrag = line.slice('a=ice-ufrag:'.length);
            } else if (ret.icePwd === '' && line.startsWith('a=ice-pwd:')) {
                ret.icePwd = line.slice('a=ice-pwd:'.length);
            }
        }

        return ret;
    }

    // 미디어별 ICE 후보를 모아 PATCH 요청용 SDP 조각을 만듭니다.
    static #generateSdpFragment(od: OfferData, candidates: RTCIceCandidate[]): string {
        const candidatesByMedia: Record<number, RTCIceCandidate[]> = {};
        for (const candidate of candidates) {
            const mid = candidate.sdpMLineIndex ?? 0;
            if (!candidatesByMedia[mid]) candidatesByMedia[mid] = [];
            candidatesByMedia[mid]!.push(candidate);
        }

        let frag = `a=ice-ufrag:${od.iceUfrag}\r\n` + `a=ice-pwd:${od.icePwd}\r\n`;

        let mid = 0;
        for (const media of od.medias) {
            const group = candidatesByMedia[mid];
            if (group !== undefined) {
                frag += `m=${media}\r\n` + `a=mid:${mid}\r\n`;
                for (const candidate of group) {
                    frag += `a=${candidate.candidate ?? ''}\r\n`;
                }
            }
            mid++;
        }

        return frag;
    }

    // 실패한 세션을 정리하고 상태와 횟수에 따라 재연결을 예약합니다.
    #handleError(err: string) {
        if (this.state !== 'running') return;

        if (this.pc !== null) {
            this.pc.close();
            this.pc = null;
        }

        this.offerData = null;

        if (this.sessionUrl !== null) {
            fetch(this.sessionUrl, { method: 'DELETE' });
            this.sessionUrl = null;
        }

        this.queuedCandidates = [];
        this.state = 'restarting';

        if (this.retryCount < 3) {
            this.retryCount++;
            this.restartTimeout = window.setTimeout(() => {
                this.restartTimeout = null;
                this.state = 'running';
                this.#start();
            }, this.retryPause);
        } else {
            this.retryCount = 0;
            this.state = 'failed';
        }

        this.conf.onError?.(`${err}, retrying in some seconds`);
    }

    // ICE 서버 조회부터 SDP 응답 적용까지 연결 협상을 진행합니다.
    #start() {
        this.#requestICEServers()
            .then((iceServers) => this.#setupPeerConnection(iceServers))
            .then((offer) => this.#sendOffer(offer))
            .then((answer) => this.#setAnswer(answer))
            .catch((err: unknown) => {
                this.#handleError(String(err));
            });
    }

    // 인증 정보를 포함한 OPTIONS 요청으로 ICE 서버를 조회합니다.
    #requestICEServers(): Promise<IceServer[]> {
        return fetch(this.conf.url, {
            method: 'OPTIONS',
            headers: { Authorization: `Bearer ${this.conf.jwt ?? ''}` },
        }).then((res) => MediaMTXWebRTCWriter.#linkToIceServers(res.headers.get('Link')));
    }

    // 미디어 방향과 이벤트를 등록하고 로컬 SDP 제안을 생성합니다.
    #setupPeerConnection(iceServers: IceServer[]): Promise<string> {
        if (this.state !== 'running') throw new Error('closed');

        this.pc = new RTCPeerConnection({
            iceServers,
            // @ts-expect-error 표준 RTCConfiguration 타입에 없는 구형 호환 옵션입니다.
            sdpSemantics: 'unified-plan',
        });

        for (const track of this.conf.stream.getTracks()) {
            this.pc.addTransceiver(track, { direction: 'sendonly' });
        }

        this.pc.onicecandidate = (evt) => this.#onLocalCandidate(evt);
        this.pc.onconnectionstatechange = () => this.#onConnectionState();

        return this.pc.createOffer().then((offer) => {
            const rawSdp = offer.sdp;
            if (!rawSdp) throw new Error('SDP not present');

            this.offerData = MediaMTXWebRTCWriter.#parseOffer(rawSdp);
            return this.pc!.setLocalDescription(offer).then(() => rawSdp);
        });
    }

    // SDP 제안을 전송하고 후속 요청에 사용할 세션 주소를 보관합니다.
    #sendOffer(offer: string): Promise<string> {
        if (this.state !== 'running') throw new Error('closed');

        return fetch(this.conf.url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/sdp',
                Authorization: `Bearer ${this.conf.jwt ?? ''}`,
            },
            body: offer,
        }).then((res) => {
            switch (res.status) {
                case 201:
                    break;
                case 404:
                    throw new Error('stream not found');
                case 400:
                    return res.json().then((e: { error: string }) => {
                        throw new Error(e.error);
                    });
                default:
                    throw new Error(`bad status code ${res.status}`);
            }
            this.sessionUrl = new URL(res.headers.get('location') ?? '', this.conf.url).toString();
            return res.text();
        });
    }

    // 서버 SDP 응답을 적용하고 대기 중인 ICE 후보를 전송합니다.
    #setAnswer(answer: string): Promise<void> {
        if (this.state !== 'running') throw new Error('closed');

        return this.pc!.setRemoteDescription(
            new RTCSessionDescription({ type: 'answer', sdp: answer }),
        ).then(() => {
            if (this.state !== 'running') return;
            if (this.queuedCandidates.length !== 0) {
                this.#sendLocalCandidates(this.queuedCandidates);
                this.queuedCandidates = [];
            }
            this.conf.onConnected?.();
        });
    }

    // 세션 주소가 준비되기 전의 ICE 후보는 대기열에 저장합니다.
    #onLocalCandidate(evt: RTCPeerConnectionIceEvent) {
        if (this.state !== 'running') return;
        if (evt.candidate !== null) {
            if (this.sessionUrl === null) {
                this.queuedCandidates.push(evt.candidate);
            } else {
                this.#sendLocalCandidates([evt.candidate]);
            }
        }
    }

    // Trickle ICE 방식으로 연결 경로 후보를 추가 전송합니다.
    #sendLocalCandidates(candidates: RTCIceCandidate[]) {
        fetch(this.sessionUrl!, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/trickle-ice-sdpfrag',
                'If-Match': '*',
            },
            body: MediaMTXWebRTCWriter.#generateSdpFragment(this.offerData!, candidates),
        })
            .then((res) => {
                switch (res.status) {
                    case 204:
                        break;
                    case 404:
                        throw new Error('stream not found');
                    default:
                        throw new Error(`bad status code ${res.status}`);
                }
            })
            .catch((err: unknown) => {
                this.#handleError(String(err));
            });
    }

    // 연결 실패·종료를 감지하여 오류 처리 흐름으로 넘깁니다.
    #onConnectionState() {
        if (this.state !== 'running') return;
        if (this.pc!.connectionState === 'failed' || this.pc!.connectionState === 'closed') {
            this.#handleError('peer connection closed');
        }
    }
}

export { MediaMTXWebRTCReader, MediaMTXWebRTCWriter };
