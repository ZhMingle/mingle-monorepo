import type { LessonId } from './types.ts';

const requirements: Record<LessonId, string[]> = {
  props: ['Explain that a component receives one props object and returns JSX. Show how destructuring and {name} read an input.', 'Distinguish defining a component once from using it multiple times. Explain why a component must not mutate its inputs.', 'Write two component uses with different prop values and state the exact UI each one displays.', 'Explain how new props change the rendered result. Do not describe React as monitoring arbitrary mutations.'],
  snapshot: ['Explain which render supplies the count captured by an event handler.', 'With count = 0, trace three setCount(count + 1) calls and compare them with three functional updaters.', 'Describe your fix and why the queued updates no longer lose increments.', 'Give a new numerical example with its exact final value, and a case where passing a replacement value is appropriate.'],
  immutable: ['Explain why changing an existing item mutates data referenced by the previous state.', 'Explain why copying only the array still shares its nested objects.', 'Describe how map creates a new array and object spread copies only the changed item.', 'Give concrete before/after values and explain how you verify that other items and the initial input stay unchanged.'],
  keys: ['Explain how React uses keys to match siblings between renders.', 'Describe what can happen to an edited draft when an index-keyed list is reversed.', 'Explain why a stable item ID preserves identity, and why a new random key does not.', 'Give an insertion, deletion, or sorting example and state which item should retain which draft.'],
  derived: ['Explain why useState uses its initial value only when state is initialized.', 'Describe how you derive visible items from the current items and query during rendering.', 'Give a concrete query change and the exact results before and after it.', 'Distinguish deriving data from synchronizing an external system. Explain that useMemo is an optional optimization.'],
  reducer: ['Explain how dispatch sends an action and how a reducer computes the next state.', 'Describe the rules for increment, decrement at zero, reset, and unknown actions.', 'Explain how you preserve the previous state and unrelated fields without side effects.', 'Give a concrete state/action/result example, including a boundary case, and name a side effect that belongs outside the reducer.']
};

export function explanationRequirements(id: LessonId, transfer = false): string[] {
  return transfer ? [
    'Explain how your transfer solution applies the same principle to the new task shown above.',
    'Use concrete inputs from this new task and state the exact resulting output or state.',
    'Answer the previous AI follow-up shown below explicitly; do not only repeat your first explanation.',
    'Give one boundary case or counterexample and explain why the solution still works.'
  ] : requirements[id];
}
