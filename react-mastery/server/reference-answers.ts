import type { LearningSession, LessonId, ReferenceAnswer, ReferenceArea } from '../shared/types.ts';

const answers: Record<LessonId, ReferenceAnswer> = {
  props: {
    paragraphs: ['A React component is a reusable function that receives a props object and returns JSX. Destructuring reads values from that object; curly braces in JSX evaluate expressions such as name.', 'We define Greeting once, then use it separately with different inputs. Greeting with name="Mina" displays Hello, Mina! and with name="Leo" displays Hello, Leo!. Each use receives its own inputs.', 'Props are read-only because those inputs belong to the caller. Mutating them can change shared data unexpectedly. Read-only inputs make the component predictable; they are not a mechanism that lets React monitor arbitrary mutations. When the parent supplies a new name, the component can render the new output.'],
    code: 'function Greeting({ name }) {\n  return <h2>Hello, {name}!</h2>;\n}\n\n<Greeting name="Mina" /> // Hello, Mina!\n<Greeting name="Leo" />  // Hello, Leo!',
    transfer: 'For a project label, read name and role from props and default role to "Member". With name="Nora" and no role, show "Nora · Member". With name="Sam" and role="Designer", show "Sam · Designer". New props produce a new label; do not mutate the input to achieve that.'
  },
  snapshot: {
    paragraphs: ['An event handler captures the state snapshot of the render that created it. Calling a setter requests another render rather than rewriting the count variable inside that handler.', 'Starting from 0, three setCount(count + 1) calls all queue replacement with 1. Three setCount(n => n + 1) calls instead compose: 0 → 1 → 2 → 3. Each updater receives the result of the previous queued update.', 'For example, restocking four units from stock 5 with four queued increments produces 9. Passing a direct value is appropriate when replacing a value independently, such as setting input text to a new string.'],
    code: 'setCount(n => n + 1);\nsetCount(n => n + 1);\nsetCount(n => n + 1); // starting at 0, next count is 3',
    transfer: 'Loop step times and queue setCount(n => n + 1) each time. With step=4, count goes 0 → 4 after one click and 4 → 8 after another. With step=2, the first click produces 2. A step of zero queues no increments.'
  },
  immutable: {
    paragraphs: ['State should be treated as a snapshot. Assigning item.done directly mutates an object still referenced by the old state. Copying only the array does not help because the nested item references remain shared.', 'Use map to create a new array, return a new object for the matching ID, and retain other item objects. Spreading the target copies its other fields while replacing done.', 'If task a is false and task b is true, toggling a gives a=true and b=true. Toggling a again gives a=false. The original input must still contain its original values, even when frozen.'],
    code: 'setItems(previous => previous.map(item =>\n  item.id === id\n    ? { ...item, done: !item.done }\n    : item\n));',
    transfer: 'The same update must work for unfamiliar IDs, labels, and initial done values. Toggle only the selected ID and keep each complete label, list order, and all original input objects intact. A missing ID leaves every item unchanged.'
  },
  keys: {
    paragraphs: ['React uses keys to match sibling components between renders. A stable key identifies an item even when its position changes, allowing its local state to stay with that item.', 'Suppose a and b appear in that order and a is edited to "Draft A". After reversing, b should appear first and a second, still holding "Draft A". Index keys identify positions instead, so state can be associated with the wrong item.', 'Use item.id as the key. A new random key on every render creates a new identity and can reset state. Keys need to be stable and unique among siblings.'],
    code: 'items.map(item => <Row key={item.id} item={item} />)',
    transfer: 'For a different starting order or different IDs, edited text should still follow the corresponding ID after Reverse. Inserting a new item before an existing one must not move the existing draft to the new row. The array index cannot provide that guarantee.'
  },
  derived: {
    paragraphs: ['useState uses its initial value to initialize state; changes to items or query do not reinitialize it. Storing filtered results separately can therefore leave them out of sync.', 'Calculate visible directly from the current items and query during each render. For items ["React", "Redux", "Vue"], query "re" produces ["React", "Redux"], while query "vue" produces ["Vue"]. An empty query matches all items.', 'An Effect is appropriate for synchronizing an external system, such as a subscription, rather than maintaining a second copy of a render calculation. useMemo may optimize an expensive calculation, but correctness should not depend on it.'],
    code: 'const visible = items.filter(item =>\n  item.toLowerCase().includes(query.toLowerCase())\n);',
    transfer: 'Derive from both current props, not only query. If items changes from ["React", "Vue"] to ["Svelte", "Vue"] while query stays "re", the result changes from ["React"] to []. Case-insensitive matching and an empty query should still work.'
  },
  reducer: {
    paragraphs: ['dispatch sends an action describing what happened. The reducer receives state and action and purely computes the next state. It must not mutate the old object or perform network or storage operations.', 'Increment adds one, decrement clamps at zero, reset sets count to zero, and an unknown action returns the existing state. Spread state when changing count so unrelated fields are preserved.', 'For {count: 0, label: "Cart"}, decrement returns a state with count 0 and label "Cart". Increment then produces count 1. Reset returns count 0 while retaining label. A network request belongs in an appropriate event handler or Effect, outside the reducer.'],
    code: 'function reducer(state, action) {\n  switch (action.type) {\n    case "increment": return { ...state, count: state.count + 1 };\n    case "decrement": return { ...state, count: Math.max(0, state.count - 1) };\n    case "reset": return { ...state, count: 0 };\n    default: return state;\n  }\n}',
    transfer: 'The rules also apply to a new initial count: starting at 7, increment produces 8, decrement produces 6, and reset produces 0. Unknown actions preserve the state and all extra fields. Repeated decrements never take a non-negative count below zero.'
  }
};

export function referenceAnswerFor(id: LessonId): ReferenceAnswer { return answers[id]; }

export function markReferenceViewed(session: LearningSession, area: ReferenceArea): boolean {
  if (session.referenceViews?.includes(area)) return false;
  session.referenceViews = [...(session.referenceViews ?? []), area];
  session.hintsUsed++;
  session.hints.push(`Viewed reference answer (${area})`);
  return true;
}
