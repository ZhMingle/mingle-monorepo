# DevNotes — Interview Studio

A lightweight bilingual learning app for backend concepts and English interview practice.

## Run locally

From this directory, run `python -m http.server 4173 --directory dist`, then open http://localhost:4173.

No dependency installation or build is required. Any static host can serve the `dist` folder.

## Features

- Four initial concepts: backend validation, race conditions, idempotency, and interval overlap.
- Mouse wheel navigation at card boundaries; left/right keyboard navigation.
- Search, practice mode, suggested answers, personal notes, and confidence tracking.
- Progress and notes are stored in this browser's localStorage; they do not sync between devices. Clearing browser data removes them.

## Source

- `dist/index.html`: application layout.
- `dist/style.css`: responsive styling.
- `dist/app.js`: lesson content and interactions.

Google Fonts is optional; system fonts are used when unavailable.
