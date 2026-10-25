import type { Challenge, RunReport } from '../shared/types.ts';
export async function runCode(challenge: Challenge, code: string): Promise<RunReport> {
  const runId = crypto.randomUUID();
  const frame = document.createElement('iframe'); frame.setAttribute('sandbox', 'allow-scripts'); frame.setAttribute('title', 'Isolated React exercise'); frame.hidden = true;
  const origin = location.origin;
  frame.srcdoc = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src ${origin} 'unsafe-eval'; connect-src 'none'; img-src 'none'; style-src 'unsafe-inline'; form-action 'none'"></head><body><script src="${origin}/sandbox-runner.js"></script></body></html>`;
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timeout); window.removeEventListener('message', handler); frame.remove(); };
    const timeout = setTimeout(() => { cleanup(); reject(new Error('代码运行超时。请检查循环或组件重复更新；主应用不会运行你的服务端代码。')); }, 10000);
    const handler = (event: MessageEvent) => {
      if (event.source !== frame.contentWindow || event.data?.type !== 'clarity:result' || event.data.runId !== runId) return;
      cleanup(); const result = event.data;
      resolve({ runId, code, tests: result.tests, error: result.error || undefined, passed: !result.error && result.tests.every((t: { passed: boolean }) => t.passed) });
    };
    window.addEventListener('message', handler);
    frame.onload = () => frame.contentWindow?.postMessage({ type: 'clarity:run', runId, code, kind: challenge.kind, variant: challenge.variant }, '*');
    document.body.append(frame);
  });
}
