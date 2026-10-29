import type { Bilingual } from './understanding.ts';
export type PathId = 'react' | 'typescript' | 'html-css' | 'dotnet' | 'nodejs' | 'java' | 'python' | 'go' | 'mysql' | 'sqlserver' | 'postgresql';
export interface PathTopic { id:string; title:Bilingual; goal:Bilingual; check:Bilingual; source:string }
export interface PathStage { id:'foundation'|'practice'|'advanced'; project:Bilingual; topics:PathTopic[] }
export interface LearningPath {
  id:PathId; name:Bilingual; mark:string; category:'frontend'|'backend'|'database';
  description:Bilingual; prerequisite:Bilingual; source:string; mode:'labs'|'topics'; stages:PathStage[];
}
export type TopicSpec = [key:string,en:string,zh:string,goalEn:string,goalZh:string,checkEn:string,checkZh:string,source?:string];
export function pathStage(path:PathId,id:PathStage['id'],project:Bilingual,source:string,topics:TopicSpec[]):PathStage {
  return {id,project,topics:topics.map(([key,en,zh,goalEn,goalZh,checkEn,checkZh,link])=>({id:`${path}.${key}`,title:{en,zh},goal:{en:goalEn,zh:goalZh},check:{en:checkEn,zh:checkZh},source:link??source}))};
}
