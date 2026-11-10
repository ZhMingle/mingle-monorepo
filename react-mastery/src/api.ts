import type { Bootstrap, SessionPayload } from '../shared/types.ts';
function requestLanguage() {
  try { const saved=localStorage.getItem('clarity.language');if(saved==='zh'||saved==='en')return saved; } catch { /* Fall back to the document language. */ }
  return document.documentElement.lang === 'zh-CN' ? 'zh' : 'en';
}
export async function request<T>(path: string, data?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, data === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Clarity-Request': '1', 'X-Clarity-Language': requestLanguage() }, body: JSON.stringify(data) });
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
