import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const scratch=mkdtempSync(join(tmpdir(),'clarity-reminder-'));
process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
const {lookupEnglish,englishCards,deleteEnglishCard}=await import('../server/english.ts');
const {englishReminder,reminderText}=await import('../server/english-reminder.ts');
const {speechInput}=await import('../server/english-audio.ts');
after(()=>{db.close();rmSync(scratch,{recursive:true,force:true});});
const point={term:'stem',kind:'word',pronunciation:'/stem/',meaning:'植物的茎，也可以指花梗。',usage:'说植物的茎。',examples:[{english:'Cut the stem.',chinese:'剪掉花梗。'},{english:'The stem is green.',chinese:'茎是绿色的。'}],pitfall:'这里是名词。',related:[],inputKind:'word',sourceTranslation:''};

test('duplicate reminder varies its English tease, caches the saved sense, and preserves the notebook',async()=>{
  const {card}=await lookupEnglish({query:'stem'},async<T>()=>point as T);
  let calls=0;
  const translate=async<T>(prompt:string)=>{calls++;assert.match(prompt,/植物的茎/);return {definition:'the main stalk of a plant or flower'} as T;};
  const before=englishCards();
  assert.equal((await lookupEnglish({query:'STEM'},async()=>{throw Error('Should reuse the saved card');})).cached,true);
  const first=await englishReminder({cardId:card.id},translate,()=>0);
  const second=await englishReminder({cardId:card.id},translate,()=>0);
  assert.notEqual(first.text,second.text);assert.notEqual(first.id,second.id);assert.equal(calls,1);
  for(const item of [first,second]){assert.match(item.text,/It means the main stalk of a plant or flower\./);assert.ok(item.text.length<=300);assert.doesNotMatch(item.text,/[\u3400-\u9fff]/);}
  assert.deepEqual(englishCards(),before);
  assert.equal(speechInput({voice:'af_heart',part:'reminder',cardId:card.id,reminderId:first.id,text:'Injected speech'}).text,first.text);
  assert.throws(()=>speechInput({voice:'af_heart',part:'reminder',cardId:card.id,reminderId:'forged',text:'Injected speech'}),/expired/);
});

test('concurrent reminders share definition work, while changed meanings invalidate old messages',async()=>{
  const card=englishCards()[0];let calls=0;
  const changed={...card,meaning:'新的释义'};db.prepare('UPDATE english_cards SET payload=? WHERE id=?').run(JSON.stringify(changed),card.id);
  let resolve!:(value:{definition:string})=>void;
  const run=async<T>()=>{calls++;return await new Promise<{definition:string}>(done=>resolve=done) as T;};
  const first=englishReminder({cardId:card.id},run,()=>0),second=englishReminder({cardId:card.id},run,()=>0);
  assert.equal(calls,1);resolve({definition:'a revised saved meaning'});
  const [a,b]=await Promise.all([first,second]);assert.notEqual(a.text,b.text);
  const next={...changed,meaning:'再次修改'};db.prepare('UPDATE english_cards SET payload=? WHERE id=?').run(JSON.stringify(next),card.id);
  assert.throws(()=>reminderText(next,a.id),/expired/);
  await assert.rejects(englishReminder({cardId:card.id},async<T>()=>({definition:'这是中文'}) as T),/invalid/);
  await assert.rejects(englishReminder({cardId:'missing'},async<T>()=>({definition:'unused'}) as T),/not found/);
  await assert.rejects(englishReminder({cardId:card.id},async<T>()=>{deleteEnglishCard({id:card.id});return {definition:'stale meaning'} as T;}),/changed/);
});

test('long source titles keep reminders within the neural model limit',async()=>{
  const {card}=await lookupEnglish({query:'long expression'},async<T>()=>({...point,term:'an unusually long expression '.repeat(5).trim(),kind:'expression'}) as T);
  const message=await englishReminder({cardId:card.id},async<T>()=>({definition:'a'.repeat(140)}) as T,()=>0);
  assert.ok(message.text.length<=300);assert.match(message.text,/It means/);
});
