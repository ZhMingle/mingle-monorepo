import type { Challenge, RunReport } from './types.ts';
import { testNames } from './test-spec.ts';
export const studyVersion='choice-code-v2';
export type StudyKind='keywords'|'choice'|'code';
export interface KeywordBlank {id:string;prompt:string;answer:string;aliases:string[];explanation:string}
export interface StudyLesson {
  overview:string;example:string;pitfall:string;
  keywords:KeywordBlank[];
  choice:{scenario:string;code:string;question:string;options:string[];correct:number;explanation:string};
  coding:{scenario:string;language:string;starter:string;requirements:string[];reference:string;rubric:string[];cases:{id:string;input:string;expected:string}[];fixtures:{correct:string;incorrect:string};execution?:Challenge};
}
export interface StudyDraft {keywords:Record<string,string>;choice:number;code:string}
export interface BlankResult {id:string;accepted:boolean;feedback:string}
export interface CodeReview {quote:string;feedback:string;issues:string[];cases:{id:string;passed:boolean;reason:string}[]}
export interface StudyAttempt {
  kind:StudyKind;at:string;input:string;accepted:boolean;supported:boolean;
  feedback?:string;blanks?:BlankResult[];review?:CodeReview;execution?:RunReport;error?:string;
}
export interface StudySession {
  id:string;topicId:string;language:'en'|'zh';version:string;createdAt:string;current:StudyKind;
  lesson:StudyLesson;draft:StudyDraft;helped:StudyKind[];attempts:StudyAttempt[];
}
export type PublicStudyLesson=Pick<StudyLesson,'overview'|'example'|'pitfall'> & {
  keywords:Pick<KeywordBlank,'id'|'prompt'>[];
  choice:Omit<StudyLesson['choice'],'correct'|'explanation'>;
  coding:Omit<StudyLesson['coding'],'reference'|'rubric'|'fixtures'>;
};
export interface StudyPayload {
  session:Omit<StudySession,'lesson'> & {lesson:PublicStudyLesson};
  references:Partial<Record<StudyKind,string>>;completed:StudyKind[];supported:boolean;
}
export const studyKinds:StudyKind[]=['choice','code'];
export function normalizeKeyword(s:string){return s.normalize('NFKC').trim().toLowerCase().replace(/[.!?;,]+$/g,'').replace(/[\s_-]+/g,' ');}
export function englishKeyword(s:string){return s.trim().length>0&&s.length<=120&&/[a-z]/i.test(s)&&/^[\x20-\x7e]+$/.test(s);}
const wordFamilies=[['idempotent','idempotence','idempotency'],['immutable','immutability'],['mutable','mutability'],['asynchronous','asynchrony','async'],['synchronous','synchrony','sync'],['encapsulate','encapsulation'],['polymorphic','polymorphism']];
export function aliasMatches(blank:KeywordBlank,value:string){
  const actual=normalizeKeyword(value);if(!englishKeyword(value))return false;
  return [blank.answer,...blank.aliases].some(expected=>{
    const key=normalizeKeyword(expected);
    return actual===key||wordFamilies.some(family=>family.includes(key)&&family.includes(actual));
  });
}
function nonempty(v:unknown,max=6000):v is string{return typeof v==='string'&&!!v.trim()&&v.length<=max;}
export function validateStudyLesson(raw:unknown):StudyLesson {
  const l=raw as StudyLesson;
  if(!l||![l.overview,l.example,l.pitfall].every(x=>nonempty(x)))throw new Error('Incomplete lesson. Please try again.');
  if(!Array.isArray(l.keywords)||(l.keywords.length!==0&&l.keywords.length<2)||l.keywords.length>3||new Set(l.keywords.map(b=>b.id)).size!==l.keywords.length||l.keywords.some(b=>!nonempty(b.id,40)||!nonempty(b.prompt,2000)||!b.prompt.includes('____')||!englishKeyword(b.answer)||!Array.isArray(b.aliases)||b.aliases.length>10||!b.aliases.every(englishKeyword)||!nonempty(b.explanation)))throw new Error('Invalid keyword exercise. Please try again.');
  const c=l.choice;
  if(!c||![c.scenario,c.question,c.explanation].every(x=>nonempty(x))||typeof c.code!=='string'||c.code.length>6000||!Array.isArray(c.options)||c.options.length!==3||!c.options.every(x=>nonempty(x,2000))||new Set(c.options).size!==3||!Number.isInteger(c.correct)||c.correct<0||c.correct>2)throw new Error('Invalid choice exercise. Please try again.');
  const p=l.coding;
  if(!p||![p.scenario,p.language,p.starter,p.reference,p.fixtures?.correct,p.fixtures?.incorrect].every(x=>nonempty(x,12000))||!Array.isArray(p.requirements)||p.requirements.length<2||p.requirements.length>4||!p.requirements.every(x=>nonempty(x,1500))||!Array.isArray(p.rubric)||p.rubric.length<2||p.rubric.length>4||!p.rubric.every(x=>nonempty(x,1500))||!Array.isArray(p.cases)||p.cases.length!==2||new Set(p.cases.map(c=>c.id)).size!==2||p.cases.some(c=>![c.id,c.input,c.expected].every(x=>nonempty(x,2000)))||p.fixtures.correct===p.fixtures.incorrect)throw new Error('Invalid coding exercise. Please try again.');
  return l;
}
export function validateBlankResults(raw:unknown,ids:string[]):BlankResult[]{
  const list=(raw as {results?:BlankResult[]})?.results;
  if(!Array.isArray(list)||list.length!==ids.length||new Set(list.map(r=>r.id)).size!==ids.length||list.some(r=>!ids.includes(r.id)||typeof r.accepted!=='boolean'||!nonempty(r.feedback,1500)))throw new Error('Incomplete keyword feedback. Your answers are saved.');
  return list;
}
export function validateCodeReview(raw:unknown,code:string,ids:string[]):CodeReview {
  const r=raw as CodeReview;
  if(!r||!nonempty(r.quote,1000)||r.quote.trim().length<4||!code.includes(r.quote.trim())||!nonempty(r.feedback,2500)||!Array.isArray(r.issues)||r.issues.length>8||!r.issues.every(x=>nonempty(x,1500))||!Array.isArray(r.cases)||r.cases.length!==ids.length||new Set(r.cases.map(c=>c.id)).size!==ids.length||r.cases.some(c=>!ids.includes(c.id)||typeof c.passed!=='boolean'||!nonempty(c.reason,1500)))throw new Error('Invalid AI code review. Your code is saved; retry later.');
  return {...r,quote:r.quote.trim()};
}
export function completedKinds(s:StudySession){return studyKinds.filter(kind=>s.attempts.some(a=>a.kind===kind&&a.accepted&&!a.error));}
export function publicStudy(s:StudySession):StudyPayload {
  const {overview,example,pitfall}=s.lesson;
  const {correct:_correct,explanation:_explanation,...choice}=s.lesson.choice;
  const {reference:_reference,rubric:_rubric,fixtures:_fixtures,...coding}=s.lesson.coding;
  return {session:{...s,current:s.current==='keywords'?'choice':s.current,lesson:{overview,example,pitfall,keywords:[],choice,coding}},references:Object.fromEntries(s.helped.filter(kind=>studyKinds.includes(kind)).map(kind=>[kind,kind==='keywords'?s.lesson.keywords.map(b=>`${b.prompt}\n${b.answer}\n${b.explanation}`).join('\n\n'):kind==='choice'?`${s.lesson.choice.options[s.lesson.choice.correct]}\n\n${s.lesson.choice.explanation}`:s.lesson.coding.reference])),completed:completedKinds(s),supported:s.helped.some(k=>studyKinds.includes(k))||s.attempts.some(a=>studyKinds.includes(a.kind)&&a.supported)};
}

export function validateExecution(raw:unknown,code:string,challenge:Challenge):RunReport {
  const r=raw as RunReport;const names=testNames[challenge.kind];
  if(!r||r.code!==code||typeof r.runId!=='string'||r.runId.length>100||!Array.isArray(r.tests)||r.tests.length!==names.length||r.tests.some((t,i)=>t.name!==names[i]||typeof t.passed!=='boolean'||typeof t.detail!=='string'||t.detail.length>4000)||r.error!==undefined&&typeof r.error!=='string')throw new Error('Incomplete browser test report. Run your current code again.');
  return {...r,passed:!r.error&&r.tests.every(t=>t.passed)};
}
