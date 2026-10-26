## 2026-10-26 — Choice and code only

- Remove keyword blanks from all active learning routes and new lesson generation. Normalize older sessions to start at choice; count only choice/code results out of two. Preserve historical keyword records and drafts.
- Connect new React coding tasks to the existing isolated browser runner with authored checks and matching-code result validation. Other languages remain clearly labeled AI code review.
- Version new sessions as choice-code-v2 and retain existing lesson content and prior results.

## 2026-10-26 — English keyword blanks, choices, and coding

- Make all 78 topics across seven paths, including React, available in three question formats without long explanations.
- Accept equivalent English terminology and noun/adjective forms using local aliases and explicit AI semantic fallback.
- Add practical choice checks, editable coding tasks, visible cases, AI code review, per-format completion, and persisted drafts/history.
- Preserve original React browser labs and prior reasoning sessions; do not equate vocabulary recall or model-reviewed code with mastery.

## 2026-10-26 — Interactive practice across learning paths

- Add on-demand AI lessons, outcome-and-reasoning tasks, changed-condition transfer, targeted feedback, references, and resumable topic progress across all 72 new topics.
- Keep task keys and reference mechanisms on the server; validate quoted evidence and distinguish independent first evidence from supported completion.
- Persist topic records and draft history in SQLite/export without changing existing React records. Code in these tasks is for reasoning, not execution.
- Add structural, privacy, persistence, concurrency, evidence, and live-model regression checks.

# Changelog

## 0.3.0

- Added an Understanding Lab for experienced React learners: predict, compare a changed condition, and select a repair with a valid boundary case.
- Combined deterministic result checks with genuine Codex evaluation of task-specific causal reasoning. Generic recall, wrong outputs, and unsupported evidence cannot verify a probe.
- Added one targeted clarification per probe, preserved original answers, recorded help separately, and allowed continuing with a visible gap.
- Added opt-in browser voice dictation, editable transcripts, optional question read-out, and clear unsupported/permission/error states.
- Persisted sessions, drafts, evidence and delayed-review eligibility separately from the existing learning labs; included them in data export.

## 0.2.0

- Simplified explanation pages to four short requirements; moved passing rules into a disclosure and removed repeated coaching copy.
- Added a persistent English/Chinese switch for navigation, all six lessons, exercises, hints, and reference answers.
- New AI assessments follow the selected language. Existing drafts, code, evidence quotes, and historical feedback keep their original text.

## 0.1.6

- Added visible hint and reference-code controls above both coding editors, including transfer tasks before code checks pass.
- Added three progressive transfer hints per lab and kept hint progression separate for each learning area.
- Recorded code-reference views as assistance without replacing drafts or awarding automatic passes.

## 0.1.5

- Added reference explanations and worked examples for all six labs, available in Explain and transfer explanations without a model call.
- Added specific answer requirements and visible passing criteria, shared with the AI evaluator.
- Persisted reference views as assistance without overwriting drafts or awarding independent mastery.
- Restored light code, caret, line numbers, and metadata inside the dark editor; reference examples retain a light reading surface.

## 0.1.4

- Darkened reading text, metadata, code examples, and inactive step labels to improve contrast.
- Switched interface and body text to the system font, keeping the established branding and heading sizes.
- Limited reading paragraphs to 72 characters per line and kept comfortable line spacing, independently of the text-size control.

## 0.1.3

- Added a persistent top-bar control to increase small text by 0–8px from its current baseline, with a reset action.
- Adjusted only text sized 12–16px; branding and larger headings retain their original sizes.
- Allowed controls and supporting content to wrap, with matching code and line-number spacing.

## 0.1.2

- Raised supporting text to a minimum of 12px across desktop and mobile layouts.
- Allowed labels, controls, and footer content to wrap as needed for readability.

## 0.1.1

- Translated the interface and all six labs, predictions, exercise instructions, hints, and rubrics into English.
- Switched new AI feedback and error messages to English while preserving verbatim learner evidence in its original language.
- Updated document language and date formatting. Existing learning records are preserved.

## 0.1.0

- Established the React learning loop and six playable labs.
- Added real browser React checks and schema-constrained Codex feedback.
- Added independent evidence gates, assisted-practice tracking, and delayed review.
- Added SQLite evidence history, autosaved drafts, and full data export.
- Added domain regression tests and a disposable browser code harness.
# 2026-10-25 — Learning path catalog

- Add TypeScript, HTML/CSS, C#/.NET, MySQL, SQL Server, and PostgreSQL guides: 72 bilingual topics, self-check questions, project milestones, and official references.
- Add searchable, filterable learning paths with direct route links; retain existing React labs and progress.
- Label study guides separately from assessed labs; reading does not change mastery.
