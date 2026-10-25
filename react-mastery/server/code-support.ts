import { challengeFor, getLesson } from '../shared/curriculum.ts';
import type { LessonId, ReferenceAnswer } from '../shared/types.ts';

const transferHints: Record<LessonId, string[]> = {
  props: [
    'Match the required text exactly: name, a space, the middle dot ·, another space, then role. A colon : is different. Keep data-testid="greeting".',
    'The checks also omit role. Give role the default value "Member" in the destructured props. For name="Sam" without a role, the result should be "Sam · Member".',
    'Use both values inside JSX braces. Edit only the Exercise component definition; the test runner supplies different props and renders it for you. You do not need to add an <Exercise ... /> call.'
  ],
  snapshot: ['The new input is step. Keep the loop, but make each queued increment depend on its previous queued value.', 'Use a functional updater inside the loop. With step=4, one click adds 4 and two clicks add 8.', 'Keep step defaulting to 4 and retain data-testid="counter". Do not hardcode the final count or number of updates.'],
  immutable: ['The transfer uses unfamiliar item IDs and values. Find the target by its ID rather than its position.', 'Return a new array and a new object for the changed item; do not mutate initialItems or its frozen objects.', 'Keep the complete label and done/todo text. Other items and their order should remain unchanged.'],
  keys: ['Each edited input should stay with the same item ID after Reverse, even with new starting data.', 'Use the stable ID as the Row key, rather than index or a random value.', 'Keep input aria-label={item.id} and the Reverse button. The runner supplies the items; no extra component call is needed.'],
  derived: ['Both items and query can change in this task. A result initialized with useState will not track those props.', 'Filter from the current props during rendering. Compare item and query after converting both to lower case.', 'An empty query matches all items. Keep data-testid="results" and do not hardcode the supplied data.'],
  reducer: ['The starting count changes, but increment, decrement, reset, and unknown-action rules stay the same.', 'Spread the previous state when changing count so unrelated fields survive. Clamp decrement at zero.', 'Reset must set count to 0, not to the new initial count. Unknown actions should return the existing state.']
};

export function codeHintsFor(id: LessonId, transfer: boolean): string[] {
  return transfer ? transferHints[id] : [...getLesson(id).hints, 'Preserve the provided identifiers. The runner renders Exercise with its own inputs; you only need to implement the component definition.'];
}

export function codeReferenceFor(id: LessonId, variant: number, transfer: boolean): ReferenceAnswer {
  let code = challengeFor(id, variant, transfer).starter;
  switch (id) {
    case 'props': code = transfer ? code.replace('{ name, role }', '{ name, role = "Member" }').replace('Ada · Developer', '{name} · {role}') : code.replace('Hello, Ada!', 'Hello, {name}!'); break;
    case 'snapshot': code = code.replaceAll('setCount(count + 1)', 'setCount(n => n + 1)'); break;
    case 'immutable': code = code.replace('const item = items.find(item => item.id === id);\n    item.done = !item.done;\n    setItems([...items]);', 'setItems(previous => previous.map(item =>\n      item.id === id ? { ...item, done: !item.done } : item\n    ));'); break;
    case 'keys': code = code.replace('key={index}', 'key={item.id}'); break;
    case 'derived': code = code.replace('const [visible] = React.useState(\n    items.filter(item => item.toLowerCase().includes(query.toLowerCase()))\n  );', 'const visible = items.filter(item =>\n    item.toLowerCase().includes(query.toLowerCase())\n  );'); break;
    case 'reducer': code = code.replace('return { count: state.count - 1 }', 'return { ...state, count: Math.max(0, state.count - 1) }').replace('return { count: 0 }', 'return { ...state, count: 0 }').replace('default: return { count: 0 }', 'default: return state'); break;
  }
  return { code, paragraphs: [getLesson(id).takeaway, ...codeHintsFor(id, transfer)], transfer: '' };
}
