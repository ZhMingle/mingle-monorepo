import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import * as Babel from '@babel/standalone';
import { testNames } from '../../shared/test-spec.ts';
import type { LessonId } from '../../shared/types.ts';

const rootElement = document.createElement('div'); document.body.append(rootElement);
let runtimeError = '';
window.addEventListener('error', event => { runtimeError = event.message; event.preventDefault(); });
const root = createRoot(rootElement, { onUncaughtError: error => { runtimeError = String(error); } });
const tick = () => new Promise(resolve => setTimeout(resolve, 35));
function assert(value: unknown, message: string): asserts value { if (!value) throw new Error(message); }
function query<T extends HTMLElement = HTMLElement>(selector: string): T { const el = rootElement.querySelector<T>(selector); assert(el, `Missing element: ${selector}`); return el; }
async function click(selector: string) { runtimeError = ''; flushSync(() => query(selector).click()); await tick(); assert(!runtimeError, runtimeError); }

window.addEventListener('message', async event => {
  if (event.source !== window.parent || event.data?.type !== 'clarity:run') return;
  const { runId, code, kind, variant } = event.data as { runId: string; code: string; kind: LessonId; variant: number };
  const names = testNames[kind]; if (!names) return;
  const results: { name: string; passed: boolean; detail: string }[] = [];
  let error = ''; let ticks = 0; const start = Date.now();
  const guard = () => { if (++ticks > 30000 || Date.now() - start > 5000) throw new Error('Execution limit reached. Check loops or recursive updates.'); };
  try {
    const compiled = Babel.transform(code, { presets: [['react', { runtime: 'classic' }]], plugins: [({ types: t }: any) => ({ visitor: {
      'WhileStatement|ForStatement|DoWhileStatement'(path: any) { if (!t.isBlockStatement(path.node.body)) path.node.body = t.blockStatement([path.node.body]); path.node.body.body.unshift(t.expressionStatement(t.callExpression(t.identifier('__guard'), []))); },
      Function(path: any) { path.ensureBlock(); path.node.body.body.unshift(t.expressionStatement(t.callExpression(t.identifier('__guard'), []))); }
    } })] }).code;
    const exported = new Function('React', '__guard', `"use strict";\n${compiled}\nreturn { Exercise: typeof Exercise === 'function' ? Exercise : null, reducer: typeof reducer === 'function' ? reducer : null };`)(React, guard);
    assert(exported.Exercise, 'Define function Exercise and keep the required test identifiers.');
    const render = async (props: Record<string, unknown> = {}) => { runtimeError = ''; flushSync(() => root.render(React.createElement(exported.Exercise, props))); await tick(); assert(!runtimeError, runtimeError); };
    const check = async (i: number, fn: () => void | Promise<void>) => { try { await fn(); results.push({ name: names[i], passed: true, detail: 'Passed' }); } catch (e) { results.push({ name: names[i], passed: false, detail: (e as Error).message }); } };
    const transfer = variant >= 2; const namesInput = variant % 2 ? ['Mia', 'Kai'] : ['Ada', 'Lin'];
    if (kind === 'props') {
      const expected = (name: string, role = 'Member') => transfer ? `${name} · ${role}` : `Hello, ${name}!`;
      await check(0, async () => { await render({ name: namesInput[0], role: 'Builder' }); assert(query('[data-testid="greeting"]').textContent?.trim() === expected(namesInput[0], 'Builder'), 'Render the provided name and required format.'); });
      await check(1, async () => { await render({ name: namesInput[1], role: 'Learner' }); assert(query('[data-testid="greeting"]').textContent?.trim() === expected(namesInput[1], 'Learner'), 'The second input must work without hardcoding.'); });
      await check(2, async () => { await render({ name: 'React', role: 'Engineer' }); assert(query('[data-testid="greeting"]').textContent?.trim() === expected('React', 'Engineer'), 'New props should update the UI.'); });
      await check(3, async () => { await render({ name: 'Sam' }); assert(query('[data-testid="greeting"]').textContent?.trim() === expected('Sam'), 'Check the fallback behavior and output format.'); });
    }
    if (kind === 'snapshot') {
      const step = transfer ? (variant % 2 ? 5 : 4) : 3;
      await check(0, async () => { await render({ step }); assert(query('[data-testid="counter"]').textContent === '0', 'Start at 0.'); });
      await check(1, async () => { await click('[data-testid="counter"]'); assert(query('[data-testid="counter"]').textContent === String(step), `One click should add ${step}.`); });
      await check(2, async () => { await click('[data-testid="counter"]'); assert(query('[data-testid="counter"]').textContent === String(step * 2), 'Repeated clicks must use updated state.'); });
      await check(3, async () => { const old = Number(query('[data-testid="counter"]').textContent); await render({ step: 2 }); await click('[data-testid="counter"]'); assert(query('[data-testid="counter"]').textContent === String(old + (transfer ? 2 : 3)), 'Use the latest props and state together.'); });
    }
    if (kind === 'immutable') {
      const items = Object.freeze([{ id: 'a', label: transfer ? 'Deploy' : 'Read', done: false }, { id: 'b', label: transfer ? 'Review' : 'Build', done: true }].map(x => Object.freeze(x)));
      const before = JSON.stringify(items);
      await check(0, async () => { await render({ initialItems: items }); assert(rootElement.textContent?.includes(items[0].label), 'Render both initial items.'); });
      await check(1, async () => { await click('[data-testid="item-a"]'); assert(query('[data-testid="item-a"]').textContent?.includes('done') && query('[data-testid="item-b"]').textContent?.includes('done'), 'Only item a should change to done.'); });
      await check(2, async () => { await click('[data-testid="item-a"]'); assert(query('[data-testid="item-a"]').textContent?.includes('todo'), 'Toggle the same item back to todo.'); });
      await check(3, () => { assert(JSON.stringify(items) === before, 'Do not mutate the initial input.'); assert(query('[data-testid="item-b"]').textContent?.includes('done'), 'Preserve the other item.'); });
    }
    if (kind === 'keys') {
      const items = [{ id: 'a', label: transfer ? 'First draft' : 'Ada' }, { id: 'b', label: transfer ? 'Second draft' : 'Lin' }];
      await check(0, async () => { await render({ initialItems: items }); assert(query<HTMLInputElement>('input[aria-label="a"]').value === items[0].label, 'Use an editable input with the item ID as aria-label.'); });
      await check(1, async () => { const input = query<HTMLInputElement>('input[aria-label="a"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, 'My personal draft'); flushSync(() => input.dispatchEvent(new Event('input', { bubbles: true }))); await tick(); assert(input.value === 'My personal draft', 'Accept input changes.'); });
      await check(2, async () => { await click('[data-testid="reverse"]'); assert(rootElement.querySelector('input')?.getAttribute('aria-label') === 'b', 'Reverse the item order.'); });
      await check(3, () => { assert(query<HTMLInputElement>('input[aria-label="a"]').value === 'My personal draft' && query<HTMLInputElement>('input[aria-label="b"]').value === items[1].label, 'Drafts must follow IDs, not array positions.'); });
    }
    if (kind === 'derived') {
      const items = transfer ? ['React', 'Vue', 'Redux'] : ['Apple', 'Banana', 'Pear'];
      const values = () => [...rootElement.querySelectorAll('[data-testid="results"] li')].map(el => el.textContent);
      await check(0, async () => { await render({ items, query: transfer ? 're' : 'a' }); assert(JSON.stringify(values()) === JSON.stringify(items.filter(i => i.toLowerCase().includes(transfer ? 're' : 'a'))), 'The initial filter is incorrect.'); });
      await check(1, async () => { await render({ items, query: transfer ? 'VUE' : 'PEAR' }); assert(JSON.stringify(values()) === JSON.stringify([transfer ? 'Vue' : 'Pear']), 'Derive the result from the latest query, ignoring case.'); });
      await check(2, async () => { await render({ items: ['New'], query: 'new' }); assert(JSON.stringify(values()) === '["New"]', 'Use the latest items prop.'); });
      await check(3, async () => { await render({ items, query: '' }); assert(values().length === items.length, 'An empty query includes all items.'); });
    }
    if (kind === 'reducer') {
      const reducer = exported.reducer; assert(reducer, 'Define the pure reducer function.');
      const state = Object.freeze({ count: transfer ? 3 : 1, label: 'keep me' }); const before = JSON.stringify(state);
      await check(0, () => { const next = reducer(state, { type: 'increment' }); assert(next.count === state.count + 1 && next.label === state.label && JSON.stringify(state) === before, 'Return a new state and preserve unrelated fields.'); });
      await check(1, () => { const next = reducer(Object.freeze({ count: 0, label: 'keep me' }), { type: 'decrement' }); assert(next.count === 0 && next.label === 'keep me', 'Decrement must stop at zero and preserve fields.'); });
      await check(2, () => { const reset = reducer(state, { type: 'reset' }); const unknown = reducer(state, { type: 'unknown' }); assert(reset.count === 0 && reset.label === 'keep me' && JSON.stringify(unknown) === before, 'Reset keeps other fields; unknown actions preserve state.'); });
      await check(3, async () => { await render({ initialCount: transfer ? 3 : 0 }); await click('[data-testid="increment"]'); assert(query('[data-testid="value"]').textContent === String((transfer ? 3 : 0) + 1), 'Dispatch increment from the component.'); await click('[data-testid="reset"]'); assert(query('[data-testid="value"]').textContent === '0', 'Dispatch reset from the component.'); });
    }
  } catch (e) { error = (e as Error).message; }
  while (results.length < names.length) results.push({ name: names[results.length], passed: false, detail: error || 'Earlier setup failed.' });
  window.parent.postMessage({ type: 'clarity:result', runId, tests: results, error, preview: rootElement.innerHTML.slice(0, 3000) }, '*');
});
