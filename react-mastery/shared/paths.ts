import { frontendPaths } from './paths-frontend.ts';
import { backendPaths } from './paths-backend.ts';
import { databasePaths } from './paths-databases.ts';
import { lessons } from './curriculum.ts';
import { translate } from './i18n.ts';
import type { PathStage } from './path-types.ts';
export const pathsVersion = '2026.10.3';
const reactStages:PathStage[]=(['foundation','practice','advanced'] as const).map((id,index)=>({
  id,project:{en:['Build reusable, predictable components.','Keep updates and list identity reliable.','Model derived data and complex transitions.'][index],zh:['构建可复用、可预测的组件。','确保状态更新和列表身份可靠。','处理派生数据与复杂状态转换。'][index]},
  topics:lessons.filter(l=>index===0?['props','snapshot'].includes(l.id):index===1?['immutable','keys'].includes(l.id):['derived','reducer'].includes(l.id)).map(l=>({id:`react.${l.id}`,title:{en:l.english,zh:translate(l.english,'zh')},goal:{en:l.summary,zh:translate(l.summary,'zh')},check:{en:l.rubric[0],zh:translate(l.rubric[0],'zh')},source:l.source}))
}));
export const learningPaths = [...frontendPaths.map(p=>p.id==='react'?{...p,stages:reactStages}:p), ...backendPaths, ...databasePaths];
export function findLearningPath(id:string) { return learningPaths.find(path=>path.id===id); }
