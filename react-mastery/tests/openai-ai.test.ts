import assert from 'node:assert/strict';
import { test } from 'node:test';
import { openAISettings, requestOpenAI } from '../server/openai-ai.ts';

const settings = { key: 'test-key', model: 'test-model' };
const schema = { type: 'object', additionalProperties: false, properties: {}, required: [] };

test('cloud AI sends a server-side structured request and reads its message', async () => {
  assert.equal(openAISettings({ OPENAI_API_KEY: settings.key }), null);
  const result = await requestOpenAI(settings, 'test input', schema, async (url, init) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer test-key');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.model, settings.model);
    assert.equal(body.input, 'test input');
    assert.equal(body.store, false);
    assert.deepEqual(body.text.format, { type: 'json_schema', name: 'clarity_result', strict: true, schema });
    return Response.json({
      status: 'completed',
      output: [{ type: 'reasoning' }, { type: 'message', content: [{ type: 'output_text', text: '{}' }] }],
    });
  });
  assert.deepEqual(result, {});
});

test('cloud AI reports refusals and provider errors without returning provider details', async () => {
  for (const response of [
    Response.json({ status: 'completed', output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'private' }] }] }),
    Response.json({ error: 'private' }, { status: 401 }),
  ]) {
    await assert.rejects(requestOpenAI(settings, 'test input', schema, async () => response), {
      status: 503,
      message: /^Cloud AI could not complete/,
    });
  }
});
