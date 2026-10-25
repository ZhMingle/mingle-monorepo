import type { LessonId } from './types.ts';
export const testNames: Record<LessonId, string[]> = {
  props: ['Initial props render', 'Different inputs work', 'Prop changes update the UI', 'Fallback behavior works'],
  snapshot: ['Starts at zero', 'One click queues every increment', 'Repeated clicks preserve updates', 'A fresh render uses the new step'],
  immutable: ['Initial items render', 'Only the target item changes', 'Toggling again restores it', 'Original input stays unchanged'],
  keys: ['Every item has an editable field', 'Local edits are accepted', 'Reordering changes positions', 'Edits follow stable item identity'],
  derived: ['Initial filter is correct', 'Query changes update results', 'New items are reflected', 'Empty query includes all items'],
  reducer: ['Increment preserves other fields', 'Decrement stops at zero', 'Reset and unknown actions are safe', 'Component dispatch updates the UI']
};
