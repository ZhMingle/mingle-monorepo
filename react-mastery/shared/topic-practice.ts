export const topicPracticeVersion = 'topic-practice-v1';
export type PracticeStep = 'try' | 'transfer';
export interface TopicTask {
  scenario:string; code:string; question:string; choices:string[]; correct:number;
  mechanism:string; reference:string; rubric:string[];
  fixtures:{correctReason:string;incorrectReason:string};
}
export interface TopicLesson {
  overview:string; example:string; exampleExplanation:string; pitfall:string;
  tasks:Record<PracticeStep,TopicTask>;
}
export interface TopicReview { correctness:number;causality:number;application:number;quote:string;feedback:string;misconception:string;followUp:string }
export interface TopicAttempt { choice:number;reason:string;at:string; supported:boolean;review?:TopicReview;error?:string }
export interface TopicSession {
  id:string;topicId:string;language:'en'|'zh';version:string;createdAt:string;
  current:'learn'|PracticeStep;
  lesson:TopicLesson;helped:PracticeStep[];
  drafts:Record<PracticeStep,{choice:number;reason:string}>;
  attempts:Record<PracticeStep,TopicAttempt[]>;
}
export type PublicTopicLesson = Omit<TopicLesson,'tasks'> & {tasks:Record<PracticeStep,Pick<TopicTask,'scenario'|'code'|'question'|'choices'>>};
export interface TopicPayload {
  session:Omit<TopicSession,'lesson'> & {lesson:PublicTopicLesson};
  references:Partial<Record<PracticeStep,string>>;
  status:'practicing'|'supported'|'first-proof';
}
function text(value:unknown,max=5000):value is string {return typeof value==='string'&&value.trim().length>0&&value.length<=max;}
export function validateTopicLesson(raw:unknown):TopicLesson {
  const l=raw as TopicLesson;
  if(!l||![l.overview,l.example,l.exampleExplanation,l.pitfall].every(x=>text(x)))throw new Error('Incomplete AI lesson. Please retry.');
  for(const step of ['try','transfer'] as const){
    const t=l.tasks?.[step];
    if(!t||![t.scenario,t.question,t.mechanism,t.reference].every(x=>text(x))||typeof t.code!=='string'||t.code.length>6000||!Array.isArray(t.choices)||t.choices.length!==3||!t.choices.every(x=>text(x,1000))||new Set(t.choices).size!==3||!Number.isInteger(t.correct)||t.correct<0||t.correct>2||!Array.isArray(t.rubric)||t.rubric.length<2||t.rubric.length>4||!t.rubric.every(x=>text(x,1000))||!text(t.fixtures?.correctReason)||!text(t.fixtures?.incorrectReason))throw new Error('AI lesson checks are incomplete. Please retry.');
  }
  if(l.tasks.try.scenario===l.tasks.transfer.scenario||l.tasks.try.question===l.tasks.transfer.question)throw new Error('The AI did not produce a distinct transfer task. Please retry.');
  return l;
}
export function validateTopicReview(raw:unknown,reason:string):TopicReview {
  const r=raw as TopicReview;
  if(!r||![r.correctness,r.causality,r.application].every(n=>Number.isInteger(n)&&n>=0&&n<=2)||![r.quote,r.feedback,r.followUp].every(x=>text(x))||typeof r.misconception!=='string'||r.misconception.length>2000||r.quote.trim().length<4||!reason.includes(r.quote.trim()))throw new Error('AI feedback did not contain valid evidence. Your answer is saved; retry later.');
  return {...r,quote:r.quote.trim()};
}
export function topicAttemptPassed(s:TopicSession,step:PracticeStep,a:TopicAttempt) {
  return a.choice===s.lesson.tasks[step].correct&&!!a.review&&a.review.correctness===2&&a.review.causality===2&&a.review.application===2&&!a.review.misconception.trim();
}
export function topicStatus(s:TopicSession):TopicPayload['status'] {
  if(!(['try','transfer'] as const).every(step=>s.attempts[step].some(a=>topicAttemptPassed(s,step,a))))return 'practicing';
  return s.helped.length===0&&(['try','transfer'] as const).every(step=>{
    const assessed=s.attempts[step].filter(a=>a.review);
    return assessed.length===1&&!assessed[0].supported&&topicAttemptPassed(s,step,assessed[0]);
  })?'first-proof':'supported';
}
export function publicTopic(s:TopicSession):TopicPayload {
  const tasks=Object.fromEntries((['try','transfer'] as const).map(step=>{const {scenario,code,question,choices}=s.lesson.tasks[step];return[step,{scenario,code,question,choices}];})) as PublicTopicLesson['tasks'];
  return {session:{...s,lesson:{overview:s.lesson.overview,example:s.lesson.example,exampleExplanation:s.lesson.exampleExplanation,pitfall:s.lesson.pitfall,tasks}},references:Object.fromEntries(s.helped.map(step=>[step,`${s.lesson.tasks[step].choices[s.lesson.tasks[step].correct]}\n\n${s.lesson.tasks[step].reference}`])),status:topicStatus(s)};
}
