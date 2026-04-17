<script setup lang="ts">
import { reactive, onBeforeMount } from 'vue';
import { useSocketStore } from '@/stores/socketStore';
import { MediaMTXWebRTCReader, MediaMTXWebRTCWriter } from '@/util/WebrtcUtil';

interface DetectionItem {
  box: { x1: number; y1: number; x2: number; y2: number }
  label: string
}

interface AiMessage {
  type: string
  socketId?: string | null
  data?: {
    detections?: DetectionItem[]
  }
}

interface PageParam {
  reader: MediaMTXWebRTCReader | null
  writer: MediaMTXWebRTCWriter | null
  webcamStream: MediaStream | null
  isShowLoading: boolean
  isError: boolean
  errorLog: string
}

onBeforeMount(async () => {
    await initPage();
});

const socketStore = useSocketStore();

const pageParam = reactive<PageParam>({
  reader: null,
  writer: null,
  webcamStream: null,
  isShowLoading: false,
  isError: false,
  errorLog: '',
});


// 페이지 초기화
async function initPage() {
    initParam();
    socketStore.createSocket('A', 'ws://localhost:8080/ws/client', true);
    socketStore.changeHandlerAll(handleMessage);
    initStreaming();
}
// 파라미터 초기화
function initParam() {
    pageParam.reader = null;
    pageParam.writer = null;
    pageParam.webcamStream = null;
    pageParam.isShowLoading = false;
    pageParam.isError = false;
    pageParam.errorLog = '';
}
// 웹소켓 핸들러 설정
function handleMessage(msg: unknown) {
    const m = msg as AiMessage;
    if(m?.type == "AI_DETECTION" && (pageParam.reader || pageParam.writer)) {
        drawDetection(m.data?.detections ?? []);
    } else {
        console.log(msg)
    }
}
// WebRTC 스트리밍 초기화
async function initStreaming() {
    window.addEventListener('beforeunload', () => {
        if(pageParam.reader) pageParam.reader.close();
        if(pageParam.writer) pageParam.writer.close();
        pageParam.webcamStream?.getTracks().forEach(t => t.stop());
    });

    pageParam.isError = false;
}
// CCTV 스트리밍 시작 (WHEP - 수신)
async function playVideo() {
    pageParam.isShowLoading = true;

    if(pageParam.reader)
        pageParam.reader.close();

    pageParam.reader = new MediaMTXWebRTCReader({
        url: `http://192.168.1.192:8889/cam1/whep`,
        jwt: ``,
        onError: (err) => {
            pageParam.isShowLoading = false;
            pageParam.isError = true;
            pageParam.errorLog = err;
            console.error(err);
        },
        onTrack: (event) => {
            pageParam.isShowLoading = false;
            pageParam.isError = false;

            const video = document.getElementById('rtsp_video') as HTMLVideoElement | null;
            if(!video) return;
            video.srcObject = event.streams[0] ?? null;
            video.muted = true;
            video.autoplay = true;
            video.controls = false;
        },
    });

    socketStore.sendMessageAll({ type: "START_STREAMING" });
}
// 웹캠 스트리밍 시작 (WHIP - 송신)
async function startWebcam() {
    pageParam.isShowLoading = true;
    pageParam.isError = false;

    if(pageParam.reader) {
        pageParam.reader.close();
        pageParam.reader = null;
    }
    if(pageParam.writer) {
        pageParam.writer.close();
        pageParam.writer = null;
    }
    if(pageParam.webcamStream) {
        pageParam.webcamStream.getTracks().forEach(t => t.stop());
        pageParam.webcamStream = null;
    }

    try {
        pageParam.webcamStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, frameRate: 15 }, audio: false });
    } catch(err) {
        pageParam.isShowLoading = false;
        pageParam.isError = true;
        pageParam.errorLog = `웹캠 접근 실패: ${err instanceof Error ? err.message : String(err)}`;
        return;
    }

    // 로컬 미리보기
    const video = document.getElementById('rtsp_video') as HTMLVideoElement | null;
    if(video) {
        video.srcObject = pageParam.webcamStream;
        video.muted = true;
        video.autoplay = true;
        video.controls = false;
    }

    pageParam.writer = new MediaMTXWebRTCWriter({
        url: `http://192.168.1.192:8889/webcam1/whip`,
        jwt: ``,
        stream: pageParam.webcamStream,
        onError: (err) => {
            pageParam.isShowLoading = false;
            pageParam.isError = true;
            pageParam.errorLog = err;
            console.error(err);
        },
        onConnected: () => {
            pageParam.isShowLoading = false;
            pageParam.isError = false;
            socketStore.sendMessageAll({ type: "START_STREAMING" });
        },
    });
}
// 스트리밍 종료
function stopVideo() {
    if(pageParam.reader) {
        pageParam.reader.close();
        pageParam.reader = null;
    }
    if(pageParam.writer) {
        pageParam.writer.close();
        pageParam.writer = null;
    }
    if(pageParam.webcamStream) {
        pageParam.webcamStream.getTracks().forEach(t => t.stop());
        pageParam.webcamStream = null;
    }

    pageParam.isShowLoading = false;
    pageParam.isError = false;

    const video = document.getElementById('rtsp_video') as HTMLVideoElement | null;
    if(video) video.srcObject = null;

    const canvas = document.getElementById('overlay') as HTMLCanvasElement | null;
    const ctx = canvas?.getContext('2d');
    if(ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);

    socketStore.sendMessageAll({ type: "STOP_STREAMING" });
}
// AI인식결과 그리기
function drawDetection(detectList: DetectionItem[]) {
    const canvas = document.getElementById('overlay') as HTMLCanvasElement | null;
    const ctx = canvas?.getContext('2d');
    if(!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'lime';
    ctx.lineWidth = 1;
    ctx.font = '13px sans-serif';

    for(const item of detectList) {
        const x = item.box.x1;
        const y = item.box.y1;
        const w = item.box.x2 - item.box.x1;
        const h = item.box.y2 - item.box.y1;

        // 사각형 그리기
        ctx.fillStyle = 'lime';
        ctx.fillRect(x, y, w, h);

        // 라벨 그리기
        const textWidth = ctx.measureText(item.label).width;
        const labelY = y > 18 ? y - 4 : y + 16;

        ctx.fillStyle = 'lime';
        ctx.fillRect(x, labelY - 13, textWidth + 4, 16);

        ctx.fillStyle = 'black';
        ctx.fillText(item.label, x + 2, labelY);
    }
}
</script>

<template>
  <div class="card h-[77.3lvh]">
      <div class="flex flex-row gap-1 pt-1" style="position:relative;z-index:10;">
          <button @click="startWebcam">시작</button>
          <button @click="stopVideo">종료</button>
      </div>

      <div style="position:relative;width:640px;height:480px;">
          <video id="rtsp_video" playsinline style="top:0;left:0;width:640px;height:480px;object-fit:cover;"></video>
          <canvas id="overlay" width="640" height="480" style="position:absolute;top:0;left:0;pointer-events:none;"></canvas>
      </div>
  </div>
</template>
