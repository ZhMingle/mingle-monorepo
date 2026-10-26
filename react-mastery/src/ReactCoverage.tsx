import { useLanguage } from './language.tsx';
export function ReactCoverage(){
  const {language}=useLanguage();const say=(en:string,zh:string)=>language==='zh'?zh:en;
  return <details className="react-coverage"><summary>{say('Coverage: 6 focused topics, not the complete React curriculum','覆盖范围：6 个重点知识点，尚非完整 React 课程')}</summary>
    <p>{say('Available: props, state snapshots, immutable updates, keys, derived data, and reducers. Other concepts may appear in examples but do not yet have dedicated practice.','已上线：Props、状态快照、不可变更新、Key、派生数据和 Reducer。其他概念可能出现在示例中，但尚无专门练习。')}</p>
    <strong>{say('Important gaps','尚缺的重要部分')}</strong><ul>
      <li>{say('JSX, events, controlled forms, lifting state, and state structure.','JSX、事件、受控表单、状态提升和状态结构。')}</li>
      <li>{say('Effect synchronization, cleanup, dependencies, refs, Context, custom Hooks, and Rules of Hooks.','Effect 同步、清理和依赖，Refs、Context、自定义 Hooks 与 Hooks 规则。')}</li>
      <li>{say('Profiling, memoization, transitions, deferred values, Suspense, error boundaries, and modern form actions.','性能分析、缓存优化、Transition、延迟值、Suspense、错误边界和现代表单 Actions。')}</li>
      <li>{say('Application practice also needs routing, data fetching/caching, testing, accessibility, and server rendering/hydration. Some of these belong to the wider ecosystem.','应用实践还需要路由、数据请求与缓存、测试、可访问性、服务端渲染与水合；其中部分属于周边生态。')}</li>
    </ul><a href="https://react.dev/learn" target="_blank" rel="noreferrer">{say('Official learning guide ↗','官方学习指南 ↗')}</a>{' · '}<a href="https://react.dev/reference/react/hooks" target="_blank" rel="noreferrer">{say('Hooks reference ↗','Hooks 参考 ↗')}</a>
  </details>;
}
