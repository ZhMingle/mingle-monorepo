import { assess } from '../server/coach.ts';
import type { LearningSession } from '../shared/types.ts';
const session = { lessonId: 'snapshot', build: { passed: true, tests: [], code: 'setCount(n => n + 1)', runId: 'live-check' } } as unknown as LearningSession;
const answer = 'State 是一次渲染的快照，事件处理函数拿到的是那一轮的值。setter 请求下一次渲染，不会把当前局部变量直接改掉。因此 count 为 0 时连续三次 setCount(count + 1)，三次都请求替换成 1。函数式更新则依次接收队列中的前值，三次加一得到 3。比如一次补货增加四件，我会把四次前值更新依次排队，避免它们都读取同一个旧库存。不是所有更新都必须用函数：如果把输入内容替换成一个独立的新字符串，直接传值就很合适。';
const assessment = await assess(session, answer, false);
console.log(JSON.stringify({ provider: assessment.provider, scores: assessment.scores, groundedEvidence: assessment.evidence.length, passed: assessment.passed, summary: assessment.summary }, null, 2));
if (!assessment.passed) process.exitCode = 1;
