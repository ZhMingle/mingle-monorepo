import test from 'node:test';
import assert from 'node:assert/strict';
import {transform} from '@babel/standalone';
import {codeFlavor,formatSource} from '../src/code-format.ts';

function syntax(code:string){
  const ast=transform(code,{ast:true,code:false,parserOpts:{plugins:['jsx','typescript']}}).ast;
  return JSON.parse(JSON.stringify(ast,(key,value)=>{
    if(['start','end','loc','extra','tokens'].includes(key))return undefined;
    if(key==='children'&&Array.isArray(value))return value.filter(node=>node.type!=='JSXText'||!/^\s*\n\s*$/.test(node.value));
    return value;
  }));
}
test('JSX and TypeScript formatting preserves code structure, string data and comments',async()=>{
  const snippets:[string,'jsx'|'typescript'][]=[
    ['function Exercise({items}){return <div>{items.map(x=><span key={x.id}>{x.name}</span>)}</div>}','jsx'],
    ['// preserve this comment\nconst value: {name: string}={name:"keep these spaces  here"};','typescript']
  ];
  for(const [source,flavor] of snippets){const result=await formatSource(source,flavor);assert.deepEqual(syntax(result),syntax(source));assert.ok(result.includes('\n'));assert.equal(await formatSource(result,flavor),result);}
});
test('HTML/CSS and database dialects format locally without rewriting quoted data',async()=>{
  const html=await formatSource('<div><span>Hello</span><style>.a{color:red;padding:2px}</style></div>','html');assert.ok(html.includes('Hello'));assert.ok(html.includes('color: red;'));
  const css=await formatSource('.a{color:red;padding:2px}','css');assert.ok(css.includes('  padding: 2px;'));
  for(const dialect of ['mysql','postgresql','tsql'] as const){const result=await formatSource("select id from users where name='Keep Case' and id=1;",dialect);assert.ok(result.includes('SELECT'));assert.ok(result.includes("'Keep Case'"));assert.equal(await formatSource(result,dialect),result);}
});
test('invalid syntax is rejected and formatting never executes learner code',async()=>{
  const source='function Exercise( { return <div>';await assert.rejects(formatSource(source,'jsx'));assert.equal(source,'function Exercise( { return <div>');
  await formatSource('globalThis.__formatTestExecuted = true;','javascript');assert.equal((globalThis as Record<string,unknown>).__formatTestExecuted,undefined);
});
test('path dialect takes priority and unknown/C# text never goes through a JS parser',async()=>{
  assert.equal(codeFlavor('Node.js','nodejs'),'javascript');assert.equal(codeFlavor('SQL','mysql'),'mysql');assert.equal(codeFlavor('SQL','postgresql'),'postgresql');assert.equal(codeFlavor('SQL','sqlserver'),'tsql');assert.equal(codeFlavor('TypeScript'),'typescript');assert.equal(codeFlavor('TSX'),'tsx');assert.equal(codeFlavor('C#'),'csharp');assert.equal(codeFlavor('CSS','html-css'),'css');assert.equal(codeFlavor('HTML/CSS','html-css'),'html');
  await assert.rejects(formatSource('class Program {}','csharp'),/indentation/);assert.equal(codeFlavor('unknown'),'text');
});
test('Java, Python and Go select their own highlighting and never use a JavaScript formatter',async()=>{
  for(const id of ['java','python','go'] as const){
    assert.equal(codeFlavor('generated language label',id),id);
    assert.equal(codeFlavor(id),id);
    await assert.rejects(formatSource('preserve learner source',id),/indentation/);
  }
});
