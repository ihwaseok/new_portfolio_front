import type { MenuItem } from '@/types/menu';

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
