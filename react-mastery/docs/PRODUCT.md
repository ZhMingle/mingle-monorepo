# Product definition

## The outcome

The learner should be able to use a concept, understand its mechanism, and explain it clearly. These are demonstrated capabilities, not time spent watching content. The product collects evidence toward those capabilities; it cannot guarantee permanent understanding or that a learner never copied an answer.

## Evidence loop

1. **Understand:** a small mental model, concrete example, boundaries, and an official React source.
2. **Predict:** retrieve an answer before running code. A wrong first answer remains recorded, even if the learner later understands the answer.
3. **Build:** change real JSX and pass behavior checks. Failing tests is normal debugging; requesting a hint is recorded assistance.
4. **Explain:** write a simple explanation with a causal account and new example. The AI returns evidence quotes, misconception notes, four rubric scores, a follow-up, and an actionable next step.
5. **Transfer:** solve a changed task and explain why the same principle applies. All evidence must belong to the same attempt; old successful fragments cannot be assembled into a fake pass.
6. **Return later:** a due-date-controlled review supplies retention evidence. Scheduled intervals are product defaults, not a claim of an optimal scientific spacing algorithm.

## Mastery states

- Learning: evidence is missing or the current attempt used assistance.
- First proof / provisional: all gates passed independently in one attempt.
- Review due: a genuine waiting period has elapsed.
- Retained: a fresh due review passed. This is dated evidence, not lifetime certification.

The system keeps prior records when later practice fails. The learner can inspect the history instead of receiving an unexplained percentage.

## Explanation rubric

Each dimension is scored 0 (absent/wrong), 1 (partial), 2 (clear and correct), or 3 (precise with boundaries):

- Correctness: accurate definitions and behavior.
- Causality: explains why, rather than repeating syntax.
- Clarity: understandable to a beginner; jargon must be explained.
- Transfer: connects the idea to a new context or counterexample.

Passing requires every score to be at least 2, two actual quotes from the learner's text, and no recorded conceptual misconception. AI uncertainty is handled by asking a targeted question and withholding a pass. These checks reduce unsupported grading; they do not make model judgment infallible.

## First release scope

Six labs are fully authored, including an introductory component task, intermediate identity/data modeling, and reducer reasoning. The roadmap identifies additional advanced topics, but they are not represented as playable until they have full exercises, rubrics, regression fixtures, and source references.

Future releases should add: asynchronous effect cleanup, stale responses, custom hook contracts, context/composition, profiling-driven optimization, accessible forms, error boundaries, and an end-to-end application project.

## Non-goals for v0.1

No public accounts, shared rankings, certificates, payment system, voice grading, generated course spam, or opaque AI-only mastery scores. No automatic completion based on model reassurance.
