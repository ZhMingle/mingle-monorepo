import {mkdir, readFile, readdir, writeFile, copyFile} from 'node:fs/promises';
import {resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build as viteBuild} from 'vite';
import {build} from 'esbuild';
import {gzipSync} from 'node:zlib';
import {buildOcrAssets} from '../scripts/build-ocr.mjs';

const appRoot = fileURLToPath(new URL('../', import.meta.url));
const outputRoot = resolve(process.argv[2] || '.');
await buildOcrAssets();
await build({absWorkingDir:appRoot,entryPoints:['src/sandbox/runner.tsx'],outfile:'public/sandbox-runner.js',bundle:true,format:'iife',minify:true,define:{'process.env.NODE_ENV':'"production"'},logLevel:'warning'});
// This is the original app entry, components and styles. No second frontend.
await viteBuild({root:appRoot, configFile:resolve(appRoot,'vite.config.ts'), build:{outDir:resolve(outputRoot,'dist-client'),emptyOutDir:true}});
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2','.gz':'application/gzip','.txt':'text/plain; charset=utf-8'};
const assets = {};
async function collect(directory, prefix = '') {
  for (const entry of await readdir(directory,{withFileTypes:true})) {
    const name = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) await collect(resolve(directory,entry.name),name);
    else {
      if (!types[extname(entry.name)]) throw new Error(`Unexpected app asset: ${name}`);
      assets[name] = {type:types[extname(entry.name)],encoding:'gzip',body:gzipSync(await readFile(resolve(directory,entry.name))).toString('base64')};
    }
  }
}
await collect(resolve(outputRoot,'dist-client'));
await mkdir(resolve(outputRoot,'dist/server'),{recursive:true});
await mkdir(resolve(outputRoot,'dist/.openai'),{recursive:true});
await build({stdin:{contents:`import {createGateway} from './hosting/gateway.mjs';\nimport {visitorWorkspace} from './shared/visitor-workspace.ts';\nexport default createGateway(${JSON.stringify(assets)},visitorWorkspace);`,resolveDir:appRoot},bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,outfile:resolve(outputRoot,'dist/server/index.js')});
await copyFile(resolve(outputRoot,'.openai/hosting.json'),resolve(outputRoot,'dist/.openai/hosting.json'));
console.log(`Built the original Clarity app for all visitors (${Object.keys(assets).length} assets).`);
