import { challengeFor } from '../shared/curriculum.ts';
import type { LessonId } from '../shared/types.ts';
// Regression fixtures only. Never used as learner grades or seeded mastery.
export function solutionFor(id: LessonId, transfer: boolean) {
  let code = challengeFor(id, 0, transfer).starter;
  switch (id) {
    case 'props': return transfer ? code.replace('{ name, role }', '{ name, role = "Member" }').replace('Ada · Developer', '{name} · {role}') : code.replace('Hello, Ada!', 'Hello, {name}!');
    case 'snapshot': return code.replaceAll('setCount(count + 1)', 'setCount(n => n + 1)');
    case 'immutable': return code.replace('const item = items.find(item => item.id === id);\n    item.done = !item.done;\n    setItems([...items]);', 'setItems(previous => previous.map(item => item.id === id ? { ...item, done: !item.done } : item));');
    case 'keys': return code.replace('key={index}', 'key={item.id}');
    case 'derived': return 'function Exercise({ items, query }) {\n  const visible = items.filter(item => item.toLowerCase().includes(query.toLowerCase()));\n  return <ul data-testid="results">{visible.map(item => <li key={item}>{item}</li>)}</ul>;\n}';
    case 'reducer': return code.replace('return { count: state.count - 1 }', 'return { ...state, count: Math.max(0, state.count - 1) }').replace('return { count: 0 }', 'return { ...state, count: 0 }').replace('default: return { count: 0 }', 'default: return state');
  }
}
