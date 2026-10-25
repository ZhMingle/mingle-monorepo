import type { LessonId } from './types.ts';

const requirements: Record<LessonId, string[]> = {
  props: ['Show how a component reads props and renders JSX.', 'Explain why props are read-only.', 'Give two different inputs and their exact outputs.', 'Distinguish defining a component from using it.'],
  snapshot: ['Explain which state snapshot the handler reads.', 'Trace three value updates versus three updater functions.', 'Explain why your fix preserves every increment.', 'Give a numerical example and a direct-replacement case.'],
  immutable: ['Explain why mutating an item changes old state.', 'Explain why copying only the array is not enough.', 'Describe how map and object spread fix the update.', 'Show before/after values and what stays unchanged.'],
  keys: ['Explain how keys identify sibling components.', 'Show how index keys can misplace an edited draft.', 'Compare stable IDs with random keys.', 'Give a reorder example and identify the retained draft.'],
  derived: ['Explain why useState does not reinitialize on prop changes.', 'Describe filtering from current items and query.', 'Give two queries and their exact results.', 'Distinguish render calculations, Effects, and useMemo.'],
  reducer: ['Explain state, action, and dispatch.', 'Cover increment, zero, reset, and unknown actions.', 'Explain purity and preservation of other fields.', 'Give a state/action/result example and a side effect.']
};

export function explanationRequirements(id: LessonId, transfer = false): string[] {
  return transfer ? [
    'Explain the same principle in this new task.',
    'Give concrete inputs and their exact outputs.',
    'Answer the previous AI follow-up.',
    'Include one boundary case or counterexample.'
  ] : requirements[id];
}
