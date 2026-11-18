import { mkdir, copyFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { build as viteBuild } from 'vite';
import react from '@vitejs/plugin-react';
import { transform } from 'esbuild';

const root = process.cwd();
await viteBuild({ configFile: false, root: resolve(root, 'public-demo'), plugins: [react()], base: '/demo-assets/', publicDir: false, build: { outDir: resolve(root, 'dist-demo'), emptyOutDir: true } });
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
const assets = {};
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await collect(resolve(directory, entry.name), relative);
    else {
      if (!types[extname(entry.name)]) throw new Error(`Unexpected public asset: ${relative}`);
      assets[relative] = { type: types[extname(entry.name)], body: (await readFile(resolve(directory, entry.name))).toString('base64') };
    }
  }
}
await collect(resolve(root, 'dist-demo'));
if (!assets['/index.html']) throw new Error('Public index is missing');
await mkdir('dist/server', { recursive: true });
await mkdir('dist/.openai', { recursive: true });
const gateway = await readFile('worker/gateway.js', 'utf8');
const compiled = await transform(`${gateway}\nexport default createGateway(${JSON.stringify(assets)});`, { loader: 'js', format: 'esm', target: 'es2022', minify: true });
await writeFile('dist/server/index.js', compiled.code);
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
console.log(`Built the public Clarity library and owner-protected gateway with ${Object.keys(assets).length} public assets.`);
