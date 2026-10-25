import type { Bootstrap, SessionPayload } from '../shared/types.ts';
export async function request<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Clarity-Request': '1', 'X-Clarity-Language': document.documentElement.lang === 'zh-CN' ? 'zh' : 'en' }, body: JSON.stringify(data) });
  const result = await response.json(); if (!response.ok) throw new Error(result.error ?? 'Request failed'); return result as T;
}
export const bootstrap = () => request<Bootstrap>('bootstrap');
export const loadSession = (id: string) => request<SessionPayload>(`session?id=${encodeURIComponent(id)}`);
