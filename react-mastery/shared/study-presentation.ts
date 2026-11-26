import type {StudyKind,StudyPayload} from './study.ts';

// Results arrive after the exercise. Their wording must never control whether
// the already prepared question and code editor remain mounted.
export function studyExercisePresentation<T extends StudyPayload>(payload:T|null){
  return payload?{...payload,session:{...payload.session,attempts:[]},references:{}}:null;
}

// A code review or an earlier reference must not delay the current choice.
export function studyResultPresentation<T extends StudyPayload>(payload:T|null,kind:StudyKind){
  return payload?{...payload,session:{...payload.session,attempts:payload.session.attempts.filter(attempt=>attempt.kind===kind)},references:payload.references[kind]?{[kind]:payload.references[kind]}:{}}:null;
}
