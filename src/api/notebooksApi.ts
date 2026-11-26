import type { MenuItem } from '@/types/menu';
import { readChatStream } from '@/util/chatStream';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_KEY = import.meta.env.VITE_API_AUTH_KEY;
const CONTENT_ROOT = import.meta.env.VITE_CONTENT_ROOT;

// 초기 페이지 설정 등에 사용하는 공통코드 응답입니다.
export interface CommonCode {
    CODE: string;
    CODE_NM: string;
    CODE_VALUE: string;
    SORT_NO: number;
}

// 그룹명을 경로에 인코딩하여 공통코드를 조회합니다.
export async function fetchCommonCodes(group: string): Promise<CommonCode[]> {
    const res = await request<{ data: CommonCode[] }>(`/common-codes/${encodeURIComponent(group)}`);
    return res.data;
}

// 공통 인증 헤더를 적용하고 서버 오류 메시지를 전달합니다.
async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'x-auth-key': AUTH_KEY,
            ...options?.headers,
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `API 오류: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

// 원문 열기에 필요한 메뉴 식별자와 검색 출처 정보입니다.
export interface ChatSource {
    menuId: string;
    parentId: string;
    title: string;
    path: string;
    excerpt: string;
    score: number;
}

// 서버에 전달하는 사용자·도우미 대화 한 건입니다.
export interface ChatTurn {
    role: 'user' | 'assistant';
    content: string;
}

// 답변과 출처, 검색 방식 및 근거 확인 상태입니다.
export interface ChatResponse {
    answer: string;
    sources: ChatSource[];
    mode: 'hybrid' | 'keyword' | 'empty' | 'general';
    intent: 'general' | 'document';
    generationUnavailable?: boolean;
    evidence?: ChatEvidence;
}

// 문서 근거의 충족 여부와 본문에서 확인된 인용 정보입니다.
export interface ChatEvidence {
    status: 'supported' | 'partial' | 'insufficient';
    reason: string;
    matchedTerms: string[];
    missingTerms: string[];
    verification: 'verified' | 'unavailable' | 'not_needed';
    quote?: string;
}

export type ChatMode = 'auto' | 'general' | 'document';

export interface ChatStreamHandlers {
    onText: (text: string) => void;
    onStatus: (message: string) => void;
    onMeta: (intent: ChatResponse['intent']) => void;
}

// POST 요청의 SSE를 읽고 최종 done 결과로 출처·근거·대체 응답을 확정합니다.
export async function streamChatMessage(
    question: string,
    history: ChatTurn[],
    handlers: ChatStreamHandlers,
    signal?: AbortSignal,
    mode: ChatMode = 'auto',
): Promise<ChatResponse> {
    const response = await fetch(`${BASE_URL}/chat/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'x-auth-key': AUTH_KEY,
        },
        body: JSON.stringify({ question, history, mode }),
        signal,
    });
    if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message || `API 오류: ${response.status}`);
    }
    // 백엔드가 먼저 배포되지 않은 경우 기존 JSON 응답도 처리합니다.
    if (response.headers.get('content-type')?.includes('application/json')) return response.json();
    if (!response.body || !response.headers.get('content-type')?.includes('text/event-stream'))
        throw new Error('서버가 올바른 스트리밍 응답을 반환하지 않았습니다.');
    let result: ChatResponse | undefined;
    await readChatStream(response.body, (event, data) => {
        const value = data as Record<string, unknown>;
        if (event === 'error')
            throw new Error(
                typeof value.message === 'string' ? value.message : '답변 생성에 실패했습니다.',
            );
        if (event === 'status' && typeof value.message === 'string')
            handlers.onStatus(value.message);
        if (event === 'answer' && typeof value.text === 'string') handlers.onText(value.text);
        if (event === 'meta' && (value.intent === 'general' || value.intent === 'document'))
            handlers.onMeta(value.intent);
        if (event === 'done') result = data as ChatResponse;
    });
    if (!result) throw new Error('답변 수신이 중단됐습니다. 다시 시도해 주세요.');
    return result;
}

// 질문·최근 대화·모드를 전송하며 취소 신호를 함께 전달합니다.
export function sendChatMessage(
    question: string,
    history: ChatTurn[],
    signal?: AbortSignal,
    mode: ChatMode = 'auto',
): Promise<ChatResponse> {
    return request<ChatResponse>('/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, history, mode }),
        signal,
    });
}

/** 전체 메뉴 목록 조회 */
export async function fetchMenuList(): Promise<MenuItem[]> {
    const res = await request<{ data: MenuItem[] }>('/sample/menuList');
    return res.data;
}

/** 특정 부모 ID의 하위 메뉴 조회 */
export async function fetchMenuByParent(id: string): Promise<MenuItem[]> {
    const res = await request<{ data: MenuItem[] }>(`/sample/menuByParent/${id}`);
    return res.data;
}

/** Joplin 동기화 실행 */
export function syncJoplin(): Promise<void> {
    return request<void>('/sample/joplinSync');
}

/** PATH 경로의 마크다운 파일 내용 조회 (nginx 정적 서빙) */
export async function fetchMarkdownContent(path: string): Promise<string> {
    if (!/\.md$/i.test(path)) throw new Error('Markdown 문서 경로가 아닙니다.');
    const res = await fetch(`${CONTENT_ROOT}${path}`);
    if (!res.ok) throw new Error(`파일 로드 오류: ${res.status} ${res.statusText}`);
    return res.text();
}
