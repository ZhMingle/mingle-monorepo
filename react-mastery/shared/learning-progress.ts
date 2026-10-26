import type { LearningPath } from './path-types.ts';
import type { LearningSession } from './types.ts';
import type { StudySession } from './study.ts';

export interface TopicProgress {completed:number;total:number;kinds:('choice'|'code')[]}
export interface ProgressSummary {completedChecks:number;totalChecks:number;completedTopics:number;totalTopics:number;percent:number}
export interface PathProgress extends ProgressSummary {topics:Record<string,TopicProgress>}
export interface LearningOverview {overall:ProgressSummary;paths:Record<string,PathProgress>}
export function summarizeTopics(topics:Record<string,TopicProgress>):ProgressSummary {
  const values=Object.values(topics);const completedChecks=values.reduce((n,t)=>n+t.completed,0);const totalChecks=values.reduce((n,t)=>n+t.total,0);
  return {completedChecks,totalChecks,completedTopics:values.filter(t=>t.completed===t.total).length,totalTopics:values.length,percent:totalChecks?Math.round(completedChecks/totalChecks*100):0};
}
// Evidence is cumulative across variations. Starting a fresh session cannot erase
// an earlier completion, and duplicate attempts never inflate the denominator.
export function learningOverview(paths:LearningPath[],sessions:StudySession[],legacy:LearningSession[]=[]):LearningOverview {
  const evidence=new Map<string,Set<'choice'|'code'>>();
  const add=(id:string,kind:'choice'|'code')=>{if(!evidence.has(id))evidence.set(id,new Set());evidence.get(id)!.add(kind);};
  for(const s of sessions)for(const a of s.attempts)if(a.accepted&&!a.error&&(a.kind==='choice'||a.kind==='code'))add(s.topicId,a.kind);
  for(const s of legacy){if(s.prediction?.correct)add(`react.${s.lessonId}`,'choice');if(s.build?.passed)add(`react.${s.lessonId}`,'code');}
  const result:LearningOverview={overall:summarizeTopics({}),paths:{}};const all:Record<string,TopicProgress>={};
  for(const path of paths){
    const topics=Object.fromEntries(path.stages.flatMap(s=>s.topics).map(topic=>{
      const kinds=(['choice','code'] as const).filter(k=>evidence.get(topic.id)?.has(k));return [topic.id,{completed:kinds.length,total:2,kinds}];
    }));
    result.paths[path.id]={...summarizeTopics(topics),topics};Object.assign(all,topics);
  }
  result.overall=summarizeTopics(all);return result;
}
export function topicNeighbors(path:LearningPath,topicId:string){
  const topics=path.stages.flatMap(s=>s.topics);const index=topics.findIndex(t=>t.id===topicId);
  return {topics,index,previous:index>0?topics[index-1]:null,next:index>=0?topics[index+1]??null:null};
}
