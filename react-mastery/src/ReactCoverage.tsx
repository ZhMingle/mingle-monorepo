import { useLanguage } from './language.tsx';
import { findLearningPath } from '../shared/paths.ts';
export function ReactCoverage(){
  const {language}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  const count=findLearningPath('react')!.stages.reduce((n,s)=>n+s.topics.length,0);
  return <details className="react-coverage"><summary>{say(`Coverage: ${count} topics, including 6 executable core labs`,`覆盖范围：${count} 个知识点，其中 6 个核心实验室支持运行验证`)}</summary>
    <p>{say('The expanded path covers events, controlled inputs, state ownership, effect cleanup, request races, refs, context, custom hooks, profiling, Suspense, error boundaries, and external-store consistency.','扩充路线包含事件、受控输入、状态归属、副作用清理、请求竞态、引用、上下文、自定义 Hook、性能分析、Suspense、错误边界与外部状态一致性。')}</p>
    <p>{say('The six original labs execute in the browser sandbox. Additional topics use AI-reviewed exercises. Completing the roadmap measures practice coverage, not seniority or independent production experience.','原有六个实验室在浏览器沙箱运行；新增主题使用 AI 评审练习。完成路线表示练习覆盖情况，不代表高级工程师水平或独立生产经验。')}</p>
    <strong>{say('Further project work','还需要的项目实践')}</strong><ul>
      <li>{say('Build and maintain a routed application with realistic data loading, caching, and failure states.','构建并维护带路由、真实数据加载、缓存与失败状态的应用。')}</li>
      <li>{say('Verify accessibility, automated tests, and release performance with observable evidence.','用可观测证据验证可访问性、自动化测试与发布性能。')}</li>
      <li>{say('Study server rendering, hydration, transitions, and form actions as dedicated follow-up work.','继续专题学习服务端渲染、水合、Transition 与表单 Actions。')}</li>
    </ul><a href="https://react.dev/learn" target="_blank" rel="noreferrer">{say('Official learning guide ↗','官方学习指南 ↗')}</a>
  </details>;
}
