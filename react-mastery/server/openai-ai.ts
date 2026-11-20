import { writingStyle } from './writing-style.ts';

export function openAISettings(env = process.env) {
  const key = env.OPENAI_API_KEY?.trim();
  const model = env.CLARITY_OPENAI_MODEL?.trim();
  return key && model ? { key, model } : null;
}

export async function requestOpenAI<T>(settings: { key: string; model: string }, prompt: string, schema: unknown, send = fetch): Promise<T> {
  const signal = AbortSignal.timeout(120_000);
  try {
    const response = await send('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${settings.key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: settings.model,
        instructions: writingStyle,
        input: prompt,
        store: false,
        text: { format: { type: 'json_schema', name: 'clarity_result', strict: true, schema } },
      }),
      signal,
    });
    if (!response.ok) throw new Error('OpenAI request failed');
    const result = await response.json();
    if (result.status !== 'completed' || !Array.isArray(result.output)) throw new Error('Incomplete response');
    const content = result.output.filter((item: { type: string }) => item.type === 'message')
      .flatMap((item: { content: { type: string; text?: string }[] }) => item.content);
    if (content.some((part: { type: string }) => part.type === 'refusal')) throw new Error('OpenAI declined the request');
    return JSON.parse(content.filter((part: { type: string }) => part.type === 'output_text')
      .map((part: { text: string }) => part.text).join('')) as T;
  } catch {
    throw Object.assign(new Error(signal.aborted
      ? 'Cloud AI timed out. Please try again. / 云端 AI 请求超时，请重试。'
      : 'Cloud AI could not complete the request. Please try again later. / 云端 AI 暂时无法完成请求，请稍后重试。'),
    { status: signal.aborted ? 504 : 503 });
  }
}
