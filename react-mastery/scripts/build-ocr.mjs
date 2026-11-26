import {createRequire} from 'node:module';
import {copyFile,mkdir,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {build} from 'esbuild';

export async function buildOcrAssets(){
  const root=fileURLToPath(new URL('../',import.meta.url));
  const require=createRequire(import.meta.url);
  const engine=dirname(require.resolve('tesseract.js/package.json'));
  const engineRequire=createRequire(join(engine,'package.json'));
  const core=dirname(engineRequire.resolve('tesseract.js-core/package.json'));
  const output=join(root,'public/ocr/v7');
  await mkdir(join(output,'lang'),{recursive:true});
  // One portable LSTM core keeps the self-contained Site below its bundle budget.
  await copyFile(join(engine,'dist/worker.min.js'),join(output,'worker.min.js'));
  await copyFile(join(core,'tesseract-core-lstm.wasm.js'),join(output,'tesseract-core-lstm.wasm.js'));
  await copyFile(join(core,'LICENSE'),join(output,'LICENSE.txt'));
  await copyFile(join(engine,'LICENSE.md'),join(output,'tesseract-license.txt'));
  await copyFile(join(engine,'dist/worker.min.js.LICENSE.txt'),join(output,'worker.min.js.LICENSE.txt'));
  await writeFile(join(output,'lang/NOTICE.txt'),'English and Simplified Chinese trained data: @tesseract.js-data/eng and @tesseract.js-data/chi_sim 1.0.0, MIT; https://github.com/naptha/tessdata.\nModels derive from Tesseract trained data under Apache-2.0; see ../LICENSE.txt.\n');
  for(const language of ['eng','chi_sim']){
    const data=dirname(require.resolve(`@tesseract.js-data/${language}/package.json`));
    await copyFile(join(data,'4.0.0_best_int',`${language}.traineddata.gz`),join(output,'lang',`${language}.traineddata.gz`));
  }
  await build({absWorkingDir:root,entryPoints:['src/ocr/recognizer.ts'],outfile:join(output,'recognizer.js'),bundle:true,format:'iife',platform:'browser',target:'es2022',minify:true,logLevel:'warning'});
}
