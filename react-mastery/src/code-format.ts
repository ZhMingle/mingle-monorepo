export type CodeFlavor='jsx'|'javascript'|'typescript'|'tsx'|'html'|'css'|'mysql'|'postgresql'|'tsql'|'csharp'|'java'|'python'|'go'|'text';
export function codeFlavor(language:string,pathId=''):CodeFlavor {
  const name=language.toLowerCase();
  if(pathId==='react'||name.includes('jsx')&&!name.includes('tsx'))return 'jsx';
  if(name.includes('tsx'))return 'tsx';
  if(pathId==='typescript'||name.includes('typescript'))return 'typescript';
  if(pathId==='nodejs'||name.includes('node.js')||name==='node')return 'javascript';
  if(pathId==='mysql'||name.includes('mysql'))return 'mysql';
  if(pathId==='postgresql'||name.includes('postgres'))return 'postgresql';
  if(pathId==='sqlserver'||name.includes('sql server')||name.includes('tsql')||name.includes('t-sql'))return 'tsql';
  if(pathId==='dotnet'||name.includes('c#')||name.includes('csharp'))return 'csharp';
  if(pathId==='java'||name==='java')return 'java';
  if(pathId==='python'||name.includes('python'))return 'python';
  if(pathId==='go'||name==='go'||name==='golang')return 'go';
  if(name.includes('html'))return 'html';
  if(name.includes('css'))return 'css';
  if(name.includes('sql'))return 'postgresql';
  if(name.includes('javascript')||name==='js')return 'javascript';
  return 'text';
}
// Format only: never evaluate learner code or send it to a service.
export async function formatSource(code:string,flavor:CodeFlavor):Promise<string>{
  if(['mysql','postgresql','tsql'].includes(flavor)){
    const {format}=await import('sql-formatter');
    return format(code,{language:flavor as 'mysql'|'postgresql'|'tsql',tabWidth:2,keywordCase:'upper'});
  }
  if(['csharp','java','python','go'].includes(flavor)||flavor==='text')throw new Error('Use editor indentation for this language.');
  const {format}=await import('prettier/standalone');
  if(flavor==='html'){
    const html=await import('prettier/plugins/html');const css=await import('prettier/plugins/postcss');
    const babel=await import('prettier/plugins/babel');const estree=await import('prettier/plugins/estree');
    return format(code,{parser:'html',plugins:[html,css,babel,estree],tabWidth:2,printWidth:90});
  }
  if(flavor==='css'){
    const css=await import('prettier/plugins/postcss');
    return format(code,{parser:'css',plugins:[css],tabWidth:2,printWidth:90});
  }
  const estree=await import('prettier/plugins/estree');
  const parser=flavor==='typescript'||flavor==='tsx'?'typescript':'babel';
  const plugin=parser==='typescript'?await import('prettier/plugins/typescript'):await import('prettier/plugins/babel');
  return format(code,{parser,plugins:[plugin,estree],filepath:`Exercise.${flavor==='tsx'?'tsx':flavor==='typescript'?'ts':flavor==='jsx'?'jsx':'js'}`,tabWidth:2,printWidth:90});
}
