import type {StudyPayload} from './study.ts';

// Results arrive after the exercise. Their wording must never control whether
// the already prepared question and code editor remain mounted.
export function studyExercisePresentation<T extends StudyPayload>(payload:T|null){
  return payload?{...payload,session:{...payload.session,attempts:[]},references:{}}:null;
}
