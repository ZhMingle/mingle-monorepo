# Learning continuity

Updated: 2026-10-25 (Pacific/Auckland). Continue learning in mingle-monorepo; the former love folder was a duplicate.

## Goal and preferences

- Goal: become a competent senior software developer and prepare for English interviews.
- Priorities: C# / ASP.NET Core and databases, project practice, English interviews, AWS, React and TypeScript.
- Key technical concepts and interview answers must be in English; Chinese explanations are welcome. Use simple, accurate English and correct both technical understanding and wording.
- Teach through Concept → Example → Interview answer → Follow-up questions, using a car rental booking scenario. Prefer one question at a time and active recall.
- Latest availability: around 4 hours/day for the rest of October; from November 1, up to 10 hours/day including breaks. Aim for one month of focused interview preparation.
- Background: 3+ years of frontend experience with Vue, TypeScript, Nuxt, API integration and enterprise interfaces; Master of Software Engineering in NZ. In NZ for two years; listening is adequate, speaking needs practice. Target frontend roles and frontend-oriented full-stack roles, adding C# / SQL / AWS capability. Do not repeatedly ask for this background or restart with a beginner curriculum.

## Current learning position

Discussed (not yet independently verified as mastered): Backend Validation, Race Condition, Idempotency, Interval Overlap.

User correctly identified time-dependent rental availability and reuse of the same idempotency key for the same operation's retry. Feedback clarified specific vehicle versus vehicle category, the A-check → B-check → A-insert → B-insert double-booking sequence, and why idempotency does not prevent two distinct users from booking overlapping dates.

Latest unanswered exercise:

Existing booking: November 10 10:00 → November 12 10:00. Use half-open intervals [start, end).

1. Does November 12 10:00 → November 14 10:00 overlap?
2. Does November 11 10:00 → November 13 10:00 overlap?
3. Does November 9 10:00 → November 10 10:00 overlap?

Answer in English: “Request 1 does / does not overlap because …” Then explain: “Does an availability check alone prevent double booking? Why?”

Overlap rule: existing.Start < requested.End && requested.Start < existing.End.

Next: obtain the learner's answers and feedback before moving on to database concurrency control. Do not treat generated lesson content as proof of mastery.

## App and history references

- App source: study-studio/dist in this repository; verified byte-identical to the old love copy before deletion.
- Existing deployed URL: https://mingle-dev-study-20261024.minglezhang7.chatgpt.site
- Sites project ID: appgprj_6adc7a3d13f08191b144b0d11c673a37; static directory: dist.
- Notes, confidence markers and current card use browser localStorage key devnotes-v1. They belong to the browser origin, not the love folder. Use the same URL and browser to retain access; changing origin does not transfer them automatically.
- Prior chat: 制定全栈学习与面试计划; thread ID 01a16ced-0609-7293-b441-8771ec21ceff. Read its history when more detail is needed; this file is a continuity summary, not a full transcript.

## Added: operation identity and retries

Expanded the Idempotency card: create a key once on confirmation; retain the key and payload across timeout retries and pending repeat clicks; restore pending operations after refresh; use a new key for a new confirmed booking. Matching payloads or timing cannot establish intent. A new key does not cancel an unresolved original booking. Added an English interview answer and active-recall exercise. Discussed and added; mastery remains unverified.

## Repository workflow preference

After each code update, commit the relevant changes and push to the remote repository. User explicitly requested this on 2026-10-25.

## Added: English interview practice

Added four cards: reusable components, integration issues, personal ownership, and collaboration with backend/QA. Each includes an English answer scaffold grounded in the existing CV, Chinese guidance, follow-ups, and an active-recall speaking exercise. Bracketed details require the learner's real examples; no invented incidents or metrics. Practice from day one, not only at the end of the month. App progress now uses the actual card count; existing card IDs and localStorage key are preserved. Content added does not establish mastery.
