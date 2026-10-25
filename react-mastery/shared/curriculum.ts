import type { Challenge, Lesson, LessonId } from './types.ts';

export const curriculumVersion = '2026.10.4';
export const lessons: Lesson[] = [
  {
    id: 'props', title: 'Write components as reusable functions', english: 'Components & props', level: 'FOUNDATIONS', minutes: 18,
    summary: 'Render different interfaces from the same component by changing its inputs.', why: 'Buttons, user cards, and list items in real projects rely on clear props interfaces for reuse.',
    takeaway: 'Props are read-only inputs. A component turns those inputs into UI.', prerequisites: [], tags: ['JSX', 'Props', 'Pure rendering'],
    paragraphs: [
      { title: 'What does a component receive?', body: 'A React component is a function that returns a description of the UI. Its argument is a props object. Destructure inputs such as name and role instead of hardcoding a particular user in JSX.' },
      { title: 'Curly braces in JSX', body: 'Curly braces let you put JavaScript expressions inside JSX. {name} displays the current input; plain name displays literal text. When a component receives new props, it calculates the UI again from those inputs.' },
      { title: 'Reuse means more than copying', body: 'The same component can serve different users at the same time. Keep inputs read-only so callers can predict its behavior. A useful test of understanding is whether you can handle an input you have never seen before.' }
    ], example: 'function Greeting({ name }) {\n  return <h2>Hello, {name}!</h2>;\n}\n\n<Greeting name="Ada" />\n<Greeting name="Lin" />',
    source: 'https://react.dev/learn/passing-props-to-a-component', rubric: ['Distinguish a component definition from a particular use of that component', 'Explain how props determine the rendered output', 'Explain read-only props and why they enable reuse', 'Give an input and output different from the example'],
    prediction: [0, 1].map(v => ({ prompt: 'What does the same component display with different props?', code: `function Label({ name }) { return <span>{name}</span>; }\n<Label name="${v ? 'Mia' : 'Ada'}" />\n<Label name="${v ? 'Kai' : 'Lin'}" />`, choices: [v ? 'Mia and Kai' : 'Ada and Lin', 'Only the last name', 'The literal text name both times'], answer: 0, explanation: 'Each use has its own props, and the component renders each set of inputs separately.' })),
    hints: ['Find the hardcoded content in JSX. Which prop should supply it?', 'Destructure the function argument, then place the variable inside JSX curly braces.']
  },
  {
    id: 'snapshot', title: 'Understand why state behaves like a snapshot', english: 'State snapshots & batching', level: 'FOUNDATIONS', minutes: 24,
    summary: 'Find out why three consecutive updates can increase a value only once.', why: 'Likes, counters, and cart quantities all involve updates that depend on a previous value.',
    takeaway: 'When the next value depends on the previous value, give React an updater function.', prerequisites: ['props'], tags: ['useState', 'Batching', 'Updater functions'],
    paragraphs: [
      { title: 'One render, one snapshot', body: 'React supplies the state for the current render when it calls your component. Event handlers capture that same snapshot. Calling setCount requests another render; it does not immediately change count inside the current function.' },
      { title: 'Three identical replacement requests', body: 'If count is 0, all three calls to setCount(count + 1) evaluate to setCount(1). React queues these updates. The handler still sees count as 0, so you have not queued three separate increments.' },
      { title: 'Let the update queue do the calculation', body: 'setCount(n => n + 1) queues a function. React passes the result of each update into the next: 0 → 1 → 2 → 3. Use this for updates that depend on a previous value. Passing a value is still appropriate for an independent replacement.' }
    ], example: '// Same snapshot: all three calls queue 1\nsetCount(count + 1);\nsetCount(count + 1);\nsetCount(count + 1);\n\n// Apply each updater to the queued value\nsetCount(n => n + 1);\nsetCount(n => n + 1);\nsetCount(n => n + 1);',
    source: 'https://react.dev/learn/queueing-a-series-of-state-updates', rubric: ['Explain render snapshots and event-handler closures', 'Explain that setState requests a render rather than rewriting a local variable', 'Compare queued replacement values with updater functions', 'Use a new practical example of an update depending on its previous value'],
    prediction: [0, 2].map(n => ({ prompt: 'What number appears after one click? Predict before running it.', code: `const [count, setCount] = useState(${n});\nfunction handleClick() {\n  setCount(count + 1);\n  setCount(count + 1);\n  setCount(count + 1);\n}`, choices: [`${n + 3}`, `${n + 1}`, `${n}`], answer: 1, explanation: `count stays at ${n} in this render. All three calls request a replacement with ${n + 1}.` })),
    hints: ['Do all three calls read count from the same render?', 'Let each update receive the previous queued result instead of the captured count.']
  },
  {
    id: 'immutable', title: 'Update arrays while protecting previous state', english: 'Immutable state updates', level: 'FOUNDATIONS', minutes: 23,
    summary: 'Update a todo correctly while leaving every other item unchanged.', why: 'Common list-editing bugs mutate old objects or accidentally change unrelated items.',
    takeaway: 'Create a new array and a new object for each item that changes.', prerequisites: ['snapshot'], tags: ['Arrays', 'Object identity', 'map'],
    paragraphs: [
      { title: 'State is not a container to mutate', body: 'Assigning directly to an object inside an array changes data referenced by an earlier render. Copying the array afterward still leaves that mutated object shared with the old array.' },
      { title: 'Copy the levels that change', body: 'Use map to return a new array. Return {...item, done: !item.done} for the target and the original object for other items. This makes the change explicit and preserves previous state snapshots.' },
      { title: 'Check what must stay unchanged', body: 'Check the target toggle, other items, list order, and initial input. A feature that appears to work while damaging other data is still incorrect.' }
    ], example: 'setItems(previous => previous.map(item =>\n  item.id === targetId\n    ? { ...item, done: !item.done }\n    : item\n));', source: 'https://react.dev/learn/updating-arrays-in-state',
    rubric: ['Describe the consequences of mutating an existing object', 'Explain why a shallow array copy does not copy its nested objects', 'Explain which update levels map and object spread each handle', 'Explain how to check that other items remain intact'],
    prediction: [0, 1].map(() => ({ prompt: 'Does this code protect the old object?', code: 'const next = [...items];\nnext[0].done = true;', choices: ['Yes, the array has been copied', 'No, both arrays still reference the same item object', 'React automatically deep-copies it'], answer: 1, explanation: 'Spreading the array copies only the array itself. The object references inside are still shared.' })),
    hints: ['The array and the objects inside it are different levels of data.', 'Return a new object for the target item and keep the original values for other items.']
  },
  {
    id: 'keys', title: 'Keep list state with the right item', english: 'Stable keys & identity', level: 'INTERMEDIATE', minutes: 26,
    summary: 'Why can text entered in a list move to the wrong person after sorting?', why: 'Forms, drag-and-drop sorting, and dynamic lists need stable component identity.',
    takeaway: 'A key represents the identity of data, not its current position.', prerequisites: ['immutable'], tags: ['Keys', 'Reconciliation', 'Local state'],
    paragraphs: [
      { title: 'React needs to recognize the same component', body: 'React uses keys to match sibling nodes between renders. A stable key tells React which component should retain its own state.' },
      { title: 'Position is not identity', body: 'With index keys, reversing a list leaves the same key at each position. Local component state can stay with that position instead of moving with the corresponding person or item.' },
      { title: 'Use stable identifiers from your data', body: 'Use IDs that are unique among siblings and stable across renders. Generating random keys during rendering creates new identities and repeatedly remounts components. A static list that never changes is a separate, limited case.' }
    ], example: '// Identity follows the data\nitems.map(item => (\n  <Row key={item.id} item={item} />\n))', source: 'https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key',
    rubric: ['Explain how keys match sibling identities', 'Explain how index keys can mismatch local state after reordering', 'Compare stable IDs with newly generated random keys', 'Give a test involving insertion, deletion, or sorting'],
    prediction: [0, 1].map(() => ({ prompt: 'Which key best preserves each editable row after the list is reversed?', code: 'items.map((item, index) =>\n  <EditableRow key={/* ? */} item={item} />\n)', choices: ['index', 'Math.random()', 'item.id'], answer: 2, explanation: 'A data ID moves with the item and does not change when its position changes.' })),
    hints: ['Should input state follow the data or the position?', 'Check the key in map. Does the data already have a stable ID?']
  },
  {
    id: 'derived', title: 'Keep derived data in rendering', english: 'Derived state, fewer effects', level: 'INTERMEDIATE', minutes: 22,
    summary: 'Avoid duplicate state so search results stay consistent with their inputs.', why: 'Many synchronization bugs come from maintaining a second copy of data that could be calculated directly.',
    takeaway: 'If a value can be calculated from props or state, first consider calculating it during rendering.', prerequisites: ['snapshot', 'immutable'], tags: ['Effects', 'Derived data', 'Single source of truth'],
    paragraphs: [
      { title: 'Initialization happens once', body: 'The value passed to useState(items.filter(...)) is used for initial state. Later changes to query or items do not automatically reinitialize that state.' },
      { title: 'Calculate derived values directly', body: 'If visibleItems is fully determined by items and query, calculate it during rendering. Each render then produces consistent results without the stale output and extra render caused by an unnecessary effect.' },
      { title: 'Effects have a different job', body: 'Effects synchronize components with external systems such as subscriptions, browser APIs, and network connections. Consider useMemo for expensive calculations, but treat it as a performance optimization rather than a requirement for correctness.' }
    ], example: 'function Results({ items, query }) {\n  const visible = items.filter(item =>\n    item.toLowerCase().includes(query.toLowerCase())\n  );\n  return <ul>{visible.map(item => <li key={item}>{item}</li>)}</ul>;\n}', source: 'https://react.dev/learn/you-might-not-need-an-effect',
    rubric: ['Explain why useState does not reinitialize when props change', 'Distinguish derived values from independent state', 'Explain the boundary between external synchronization and render calculations', 'Explain when memoization is worth considering'],
    prediction: [0, 1].map(() => ({ prompt: 'When query changes, does visible automatically reinitialize?', code: 'const [visible] = useState(\n  items.filter(item => item.includes(query))\n);', choices: ['Yes, every render initializes state', 'No, the initial value is used only at initialization', 'Yes, as long as you pass an Effect'], answer: 1, explanation: 'This stores derived data as independent state. Changing query does not rerun state initialization; calculating the result during rendering is a better fit.' })),
    hints: ['Is this data fully determined by existing props?', 'Remove the unnecessary useState and let the filter run during each render.']
  },
  {
    id: 'reducer', title: 'Define state transitions with a reducer', english: 'Reducers & state transitions', level: 'ADVANCED', minutes: 30,
    summary: 'Extract testable state rules from event handlers.', why: 'Complex forms and interactions need consistent rules rather than assignments scattered throughout the UI.',
    takeaway: 'A reducer purely calculates the next state from the previous state and an action.', prerequisites: ['immutable', 'derived'], tags: ['useReducer', 'Pure functions', 'State transitions'],
    paragraphs: [
      { title: 'Events describe what happened', body: 'Components dispatch actions such as dispatch({type: ...}) instead of calculating the next state everywhere. The reducer defines how each event changes state in one place.' },
      { title: 'Pure functions are easier to verify', body: 'The same state and action should produce the same result. Do not mutate old state, request the network, write storage, or depend on randomness inside a reducer. Put side effects in an appropriate event handler or effect.' },
      { title: 'Boundaries are part of the rules', body: 'Handle the zero boundary, reset, unknown actions, and preservation of other fields as well as ordinary increments and decrements. A reducer helps make transitions predictable and testable; it does not automatically solve application complexity.' }
    ], example: 'function reducer(state, action) {\n  switch (action.type) {\n    case "increment": return { ...state, count: state.count + 1 };\n    case "reset": return { ...state, count: 0 };\n    default: return state;\n  }\n}', source: 'https://react.dev/learn/extracting-state-logic-into-a-reducer',
    rubric: ['Explain the relationship between state, actions, and dispatch', 'Explain reducer purity and immutable updates', 'Explain boundary handling and unknown actions', 'Distinguish a state transition from a side effect with an example'],
    prediction: [0, 1].map(() => ({ prompt: 'Which responsibility does not belong inside a reducer?', code: 'function reducer(state, action) {\n  // Which responsibility should move outside?\n}', choices: ['Return the next state based on an action', 'Preserve unchanged fields', 'Send a network request and write to a database'], answer: 2, explanation: 'A reducer should purely calculate state. Network and storage operations are side effects and belong elsewhere.' })),
    hints: ['List the next state for each action and the fields that must stay unchanged.', 'Clamp decrements at zero, return old state for unknown actions, and protect the previous object on every update.']
  }
];

export function getLesson(id: string): Lesson {
  const lesson = lessons.find(l => l.id === id);
  if (!lesson) throw new Error('Unknown lesson');
  return lesson;
}

export function challengeFor(id: LessonId, variant: number, transfer = false): Challenge {
  const kind = id; const n = variant % 2; const base = { kind, variant: transfer ? n + 2 : n };
  switch (id) {
    case 'props': return { ...base, title: transfer ? 'Transfer: a reusable project label' : 'Build a greeting component that uses its inputs', brief: transfer ? 'Accept name and role and display “name · role”. Update when props change and default role to Member.' : 'Accept a name prop and display “Hello, name!”. Replace the hardcoded content and make sure an unfamiliar name also works.', criteria: transfer ? ['Read both props', 'Default role to Member', 'Update correctly when props change'] : ['Display the current name', 'Support different names', 'Update the UI when props change'], starter: transfer ? 'function Exercise({ name, role }) {\n  return <p data-testid="greeting">Ada · Developer</p>;\n}' : 'function Exercise({ name = "Ada" }) {\n  return <h2 data-testid="greeting">Hello, Ada!</h2>;\n}' };
    case 'snapshot': return { ...base, title: transfer ? 'Transfer: restock a configurable quantity' : 'Fix the counter to add 3 per click', brief: transfer ? 'Exercise receives a step prop, defaulting to 4. On each click, increase the count by step using consecutive +1 updater functions in the queue. Keep data-testid.' : 'Each click should add 3, including after repeated clicks. Fix the code using updates that depend on the previous value.', criteria: ['Start at 0', transfer ? 'Respect the step input' : 'Add 3 per click', 'Keep every update across repeated clicks'], starter: `function Exercise(${transfer ? '{ step = 4 }' : ''}) {\n  const [count, setCount] = React.useState(0);\n  function add() {\n${transfer ? '    for (let i = 0; i < step; i++) {\n      setCount(count + 1);\n    }' : '    setCount(count + 1);\n    setCount(count + 1);\n    setCount(count + 1);'}\n  }\n  return <button data-testid="counter" onClick={add}>{count}</button>;\n}` };
    case 'immutable': return { ...base, title: transfer ? 'Transfer: protect incoming item data' : 'Fix an immutable todo toggle', brief: 'Exercise receives initialItems. Clicking an item toggles its done value and displays its full label with done/todo. Do not mutate the initial input or other items. Preserve identifiers.', criteria: ['Toggle the target in both directions', 'Leave other items unchanged', 'Never mutate the frozen initial input'], starter: 'function Exercise({ initialItems }) {\n  const [items, setItems] = React.useState(initialItems);\n  function toggle(id) {\n    const item = items.find(item => item.id === id);\n    item.done = !item.done;\n    setItems([...items]);\n  }\n  return <div>{items.map(item =>\n    <button key={item.id} data-testid={"item-" + item.id}\n      onClick={() => toggle(item.id)}>\n      {item.label}: {item.done ? "done" : "todo"}\n    </button>\n  )}</div>;\n}' };
    case 'keys': return { ...base, title: transfer ? 'Transfer: preserve drafts after sorting' : 'Fix input identity after reordering', brief: 'Exercise receives initialItems. Each row has its own editable input state. After Reverse, each draft must move with its matching ID. Preserve the button and aria-label.', criteria: ['Allow editing', 'Reverse the order correctly', 'Keep drafts with item IDs rather than positions'], starter: 'function Row({ item }) {\n  const [value, setValue] = React.useState(item.label);\n  return <input aria-label={item.id} value={value}\n    onChange={event => setValue(event.target.value)} />;\n}\nfunction Exercise({ initialItems }) {\n  const [items, setItems] = React.useState(initialItems);\n  return <div>\n    <button data-testid="reverse" onClick={() => setItems([...items].reverse())}>Reverse</button>\n    {items.map((item, index) => <Row key={index} item={item} />)}\n  </div>;\n}' };
    case 'derived': return { ...base, title: transfer ? 'Transfer: search as inputs and data change' : 'Keep filtered results consistent with props', brief: 'Exercise receives an items array of strings and a query. Display items containing query, ignoring case. Derive the result directly and keep data-testid="results".', criteria: ['Filter the initial items correctly', 'Update immediately when query changes', 'Handle changed items and an empty query'], starter: 'function Exercise({ items, query }) {\n  const [visible] = React.useState(\n    items.filter(item => item.toLowerCase().includes(query.toLowerCase()))\n  );\n  return <ul data-testid="results">\n    {visible.map(item => <li key={item}>{item}</li>)}\n  </ul>;\n}' };
    case 'reducer': return { ...base, title: transfer ? 'Transfer: state rules with a new initial value' : 'Implement a testable counter reducer', brief: 'Implement reducer(state, action). Support increment, decrement with a minimum of 0, reset to count 0, and unknown actions that preserve state. Protect previous state and other fields. Fix the component buttons.', criteria: ['Handle increment and decrement', 'Handle the zero boundary and reset', 'Preserve previous state and extra fields'], starter: 'function reducer(state, action) {\n  switch (action.type) {\n    case "increment": return { ...state, count: state.count + 1 };\n    case "decrement": return { count: state.count - 1 };\n    case "reset": return { count: 0 };\n    default: return { count: 0 };\n  }\n}\nfunction Exercise({ initialCount = 0 }) {\n  const [state, dispatch] = React.useReducer(reducer, { count: initialCount });\n  return <div>\n    <output data-testid="value">{state.count}</output>\n    <button data-testid="increment" onClick={() => dispatch({ type: "increment" })}>+</button>\n    <button data-testid="decrement" onClick={() => dispatch({ type: "decrement" })}>−</button>\n    <button data-testid="reset" onClick={() => dispatch({ type: "reset" })}>Reset</button>\n  </div>;\n}' };
  }
}

export const roadmap = [
  { phase: '01', title: 'Build a React mental model', subtitle: 'FOUNDATIONS', items: ['props', 'snapshot', 'immutable'] },
  { phase: '02', title: 'Create reliable interactions', subtitle: 'INTERMEDIATE', items: ['keys', 'derived'] },
  { phase: '03', title: 'Manage complexity', subtitle: 'ADVANCED', items: ['reducer'] },
  { phase: '04', title: 'From components to real applications', subtitle: 'NEXT MILESTONE', planned: ['Effect cleanup and async races', 'Custom hooks and reuse boundaries', 'Context and component composition', 'Profiling and memoization', 'Error boundaries, Suspense, and architecture'] }
];
