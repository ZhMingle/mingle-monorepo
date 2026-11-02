import type { Bootstrap, SessionPayload } from '../shared/types.ts';
export async function request<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Clarity-Request': '1', 'X-Clarity-Language': document.documentElement.lang === 'zh-CN' ? 'zh' : 'en' }, body: JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) {
    if (result.error === 'Unknown topic.') throw new Error(document.documentElement.lang === 'zh-CN'
      ? '当前服务未识别此知识点。请重新运行 Start.ps1 更新本机服务，再刷新页面。'
      : 'The server does not recognize this topic. Run Start.ps1 again to update the local service, then refresh this page.');
    throw new Error(result.error ?? 'Request failed');
  }
  return result as T;
}
export const bootstrap = () => request<Bootstrap>('bootstrap');
export const loadSession = (id: string) => request<SessionPayload>(`session?id=${encodeURIComponent(id)}`);
