import {mkdir,copyFile} from 'node:fs/promises';
for(const name of ['index.html','styles.css','app.mjs','model.mjs']){
  await mkdir(new URL('./dist/',import.meta.url),{recursive:true});
  await copyFile(new URL('./web/'+name,import.meta.url),new URL('./dist/'+name,import.meta.url));
}
console.log('Built rejection journal in dist/.');
