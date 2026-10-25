export type Bilingual = { en: string; zh: string };
export type ProbeId = 'predict' | 'change' | 'repair';
export interface ProbeView {
  id: ProbeId; title: Bilingual; question: Bilingual; code: string; alternateCode?: string;
  outcomeLabels: Bilingual[]; choices?: { id: string; code: string }[];
}
export interface Probe extends ProbeView {
  expected: number[]; correctChoice?: string; mechanism: string; help: Bilingual;
}
export interface ReasoningReview {
  causality: number; boundaries: number; quote: string; misconception: string; feedback: string; followUp: string;
}
export interface ProbeAttempt {
  outcomes: number[]; choice: string; explanation: string; combinedExplanation: string;
  submittedAt: string; review?: ReasoningReview; outcomeCorrect?: boolean; supported?: boolean;
  verified?: boolean; error?: string;
}
export interface UnderstandingSession {
  id: string; seed: number; createdAt: string; current: number; completedAt?: string;
  reviewOf?: string; reviewAt?: string; version: string;
  attempts: Partial<Record<ProbeId, ProbeAttempt[]>>;
  helped: ProbeId[];
  drafts: Partial<Record<ProbeId, { outcomes: string[]; choice: string; explanation: string }>>;
}
export interface UnderstandingPayload {
  session: UnderstandingSession | null; task: ProbeView | null; help?: Bilingual;
  evidence: { id: ProbeId; verified: boolean; independent: boolean; attempts: number }[];
  trail: { task: ProbeView; attempts: ProbeAttempt[]; helped: boolean }[];
  history: { id: string; createdAt: string; completedAt?: string; independent: number; reviewAt?: string; reviewOf?: string }[];
}
export const understandingVersion = 'snapshot-probes-v1';
export const probeIds: ProbeId[] = ['predict', 'change', 'repair'];
export const understandingSources = ['https://react.dev/learn/state-as-a-snapshot', 'https://react.dev/learn/queueing-a-series-of-state-updates'];

export function probeFor(seed: number, id: ProbeId): Probe {
  const n = 2 + seed % 7; const step = 2 + seed % 4;
  if (id === 'predict') return {
    id, title: { en: 'Predict before running', zh: '先预测，再运行' },
    question: { en: 'After ONE click, what will the next render show? Explain the value read by each setter.', zh: '点击一次后，下一次渲染显示多少？说说每次 setter 读到的值。' },
    code: `const [count, setCount] = useState(${n});\nfunction onClick() {\n  setCount(count + 1);\n  setCount(count + 1);\n}`,
    outcomeLabels: [{ en: 'Next count', zh: '下一次 count' }], expected: [n + 1],
    mechanism: `Both calls read snapshot count=${n}, each queues replacement with ${n + 1}; setter does not change the handler variable.`,
    help: { en: `Both reads see ${n}. They queue the same replacement, ${n + 1}. A setter requests another render; it does not rewrite the handler variable.`, zh: `两次都读到 ${n}，因此都请求替换成 ${n + 1}。Setter 请求下一次渲染，不会改写当前处理函数中的变量。` }
  };
  if (id === 'change') {
    const multiply = 2 + seed % 2;
    return {
      id, title: { en: 'Change one condition', zh: '换一个条件' },
      question: { en: 'Same starting count. Compare A and B: what does each show after one click? Walk through the queue; do not just say “async”.', zh: '初始 count 相同。A、B 各点击一次，分别显示多少？按顺序推导队列，不要只说“异步”。' },
      code: `// A — initial count: ${n}\nsetCount(v => v + 2);\nsetCount(count + 1);\nsetCount(v => v * ${multiply});`,
      alternateCode: `// B — initial count: ${n}\nsetCount(count + 1);\nsetCount(v => v + 2);\nsetCount(v => v * ${multiply});`,
      outcomeLabels: [{ en: 'A result', zh: 'A 的结果' }, { en: 'B result', zh: 'B 的结果' }],
      expected: [(n + 1) * multiply, (n + 3) * multiply],
      mechanism: `A queues ${n}+2, then replacement with captured ${n}+1, then multiply ${multiply}. B replaces first, then adds 2, then multiplies. Explain why replacement discards the preceding queued result, while updater functions receive it.`,
      help: { en: `Trace A: ${n} → ${n + 2} → ${n + 1} → ${(n + 1) * multiply}. Trace B: ${n} → ${n + 1} → ${n + 3} → ${(n + 3) * multiply}. A replacement uses captured count; a function uses the queued result.`, zh: `A：${n} → ${n + 2} → ${n + 1} → ${(n + 1) * multiply}。B：${n} → ${n + 1} → ${n + 3} → ${(n + 3) * multiply}。传值使用捕获的 count；函数更新接收队列前值。` }
    };
  }
  const choices = [
    { id: 'updaters', code: 'setCount(v => v + step);\nsetCount(v => v + 1);' },
    { id: 'replacements', code: 'setCount(step);\nsetCount(1);' },
    { id: 'captured', code: 'setCount(count + step);\nsetCount(count + 1);' }
  ];
  const offset = seed % 3;
  return {
    id, title: { en: 'Repair it, then name a boundary', zh: '修复它，再说明边界' },
    question: { en: `Choose a repair that applies BOTH relative changes in order. With count=${n} and step=${step}, predict its result. Why does it work, and when is a direct replacement still appropriate?`, zh: `选择能依次保留两次增量的修复。count=${n}、step=${step} 时结果是多少？说明原因，并举一个适合直接传值替换的场景。` },
    code: `// Intent: add step, then add one\nfunction add(step) {\n  setCount(count + step);\n  setCount(count + 1);\n}`,
    choices: [...choices.slice(offset), ...choices.slice(0,offset)],
    outcomeLabels: [{ en: 'Repaired result', zh: '修复后的结果' }], expected: [n + step + 1], correctChoice: 'updaters',
    mechanism: `Two functional updaters preserve both increments: ${n} → ${n + step} → ${n + step + 1}. Direct replacement is appropriate for an independent value, such as event.target.value or reset to 0. Do not demand all setters always use updater functions.`,
    help: { en: `Choose the two updater functions: ${n} → ${n + step} → ${n + step + 1}. Replacing text with event.target.value or resetting to 0 is a valid direct replacement.`, zh: `两次都用函数更新：${n} → ${n + step} → ${n + step + 1}。输入框替换为 event.target.value，或重置为 0，都适合直接传值。` }
  };
}

export function publicProbe(probe: Probe): ProbeView {
  const { expected: _, correctChoice: __, mechanism: ___, help: ____, ...view } = probe;
  return view;
}
export function outcomesMatch(probe: Probe, outcomes: number[], choice: string): boolean {
  return outcomes.length === probe.expected.length && outcomes.every((n,i) => Number.isFinite(n) && n === probe.expected[i]) && (!probe.correctChoice || choice === probe.correctChoice);
}
export function validateReasoning(raw: unknown, explanation: string): ReasoningReview {
  const r = raw as ReasoningReview;
  if (!r || ![r.causality,r.boundaries].every(n => Number.isInteger(n) && n >= 0 && n <= 2) || ['quote','misconception','feedback','followUp'].some(k => typeof r[k as keyof ReasoningReview] !== 'string')) throw new Error('Incomplete AI reasoning assessment. Your response is saved; retry when ready.');
  if (r.quote.trim().length < 4 || !explanation.includes(r.quote.trim())) throw new Error('AI evidence did not match your explanation. Your response is saved; please retry.');
  return { ...r, quote: r.quote.trim(), feedback: r.feedback.slice(0,1200), followUp: r.followUp.slice(0,500) };
}
export function reasoningVerified(review: ReasoningReview, resultCorrect: boolean) {
  return resultCorrect && review.causality === 2 && review.boundaries === 2 && !review.misconception.trim();
}
export function understandingEvidence(session: UnderstandingSession) {
  return probeIds.map(id => {
    const attempts = session.attempts[id] ?? []; const valid = attempts.filter(a => a.review);
    const latest = valid.at(-1);
    return { id, verified: !!latest?.verified, independent: !!latest?.verified && valid.length === 1 && !session.helped.includes(id) && !latest.supported, attempts: valid.length };
  });
}
