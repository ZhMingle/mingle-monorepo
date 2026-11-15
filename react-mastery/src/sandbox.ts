import type { Challenge, RunReport } from '../shared/types.ts';
let runnerSource:Promise<string>|undefined;
function loadRunner(){
  if(!runnerSource)runnerSource=fetch('/sandbox-runner.js',{credentials:'same-origin'}).then(response=>{if(!response.ok)throw new Error('The browser runner could not load. Reload and retry.');return response.text();}).catch(error=>{runnerSource=undefined;throw error;});
  return runnerSource;
}
export async function runCode(challenge: Challenge, code: string): Promise<RunReport> {
  const runner=await loadRunner();
  const runId = crypto.randomUUID();
  const frame = document.createElement('iframe'); frame.setAttribute('sandbox', 'allow-scripts'); frame.setAttribute('title', 'Isolated React exercise'); frame.hidden = true;
  frame.srcdoc = `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' 'unsafe-eval'; connect-src 'none'; img-src 'none'; style-src 'unsafe-inline'; form-action 'none'"></head><body><script>${runner.replace(/<\/script/gi,'<\\/script')}</script></body></html>`;
  return new Promise((resolve, reject) => {
    const cleanup = () => { clearTimeout(timeout); window.removeEventListener('message', handler); frame.remove(); };
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Code execution timed out. Check for loops or repeated component updates. Learner code runs only in the browser.')); }, 10000);
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
