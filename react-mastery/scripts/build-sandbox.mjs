import { build } from 'esbuild';
await build({ entryPoints: ['src/sandbox/runner.tsx'], outfile: 'public/sandbox-runner.js', bundle: true, format: 'iife', minify: true, define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'warning' });
