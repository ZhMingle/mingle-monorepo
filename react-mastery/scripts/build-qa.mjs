import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
await build({ entryPoints: ['scripts/qa-browser.ts'], bundle: true, format: 'iife', outfile: 'dist/qa-browser.js', logLevel: 'warning' });
await writeFile('dist/sandbox-qa.html', '<!doctype html><html><meta charset="utf-8"><title>Clarity sandbox verification</title><style>body{font:16px system-ui;padding:30px;background:#f6f8ef;color:#354b28}button{padding:14px 25px;cursor:pointer}pre{font:14px/1.9 Consolas;white-space:pre-wrap}</style><h1>Sandbox regression verification</h1><p>Synthetic code only. No learner records or AI calls are created.</p><button id="run">Run all sandbox checks</button><pre id="results">Ready</pre><script src="/qa-browser.js"></script></html>');
