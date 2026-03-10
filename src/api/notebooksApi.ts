import type { MenuItem } from '@/types/menu'

const BASE_URL = import.meta.env.VITE_API_BASE_URL
const AUTH_KEY = import.meta.env.VITE_API_AUTH_KEY
const CONTENT_ROOT = import.meta.env.VITE_CONTENT_ROOT

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'x-auth-key': AUTH_KEY,
      ...options?.headers,
    },
  })
  if (!res.ok) throw new Error(`API 오류: ${res.status} ${res.statusText}`)
  return res.json()
}

/** 전체 메뉴 목록 조회 */
export async function fetchMenuList(): Promise<MenuItem[]> {
  const res = await request<{ data: MenuItem[] }>('/sample/menuList')
  return res.data
}

/** 특정 부모 ID의 하위 메뉴 조회 */
export async function fetchMenuByParent(id: string): Promise<MenuItem[]> {
  const res = await request<{ data: MenuItem[] }>(`/sample/menuByParent/${id}`)
  return res.data
}

/** Joplin 동기화 실행 */
export function syncJoplin(): Promise<void> {
  return request<void>('/sample/joplinSync')
}

/** PATH 경로의 마크다운 파일 내용 조회 (nginx 정적 서빙) */
export async function fetchMarkdownContent(path: string): Promise<string> {
  const res = await fetch(`${CONTENT_ROOT}${path}`)
  if (!res.ok) throw new Error(`파일 로드 오류: ${res.status} ${res.statusText}`)
  return res.text()
}
