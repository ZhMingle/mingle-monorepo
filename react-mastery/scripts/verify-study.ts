// Opt-in real model checks. Uses an isolated database, never learner progress.
import {randomUUID} from 'node:crypto';
process.env.DATA_DIR='data/mixed-smoke';
const {db}=await import('../server/store.ts');
const {studyAction,getStudy,saveStudy}=await import('../server/study.ts');
import type {StudyPayload} from '../shared/study.ts';
try{
  const topics=process.argv.includes('--all')?['react.props','typescript.inference','html-css.box-model','dotnet.types','mysql.joins','sqlserver.indexes','postgresql.constraints']:['react.props','typescript.inference','postgresql.constraints'];
  for(const topicId of topics){
    const payload=await studyAction('new',{topicId},'zh') as StudyPayload;const s=getStudy(payload.session.id);
    console.log(JSON.stringify({topicId,id:s.id,keywords:s.lesson.keywords,choice:s.lesson.choice,coding:s.lesson.coding}));
    const draft={...s.draft,keywords:Object.fromEntries(s.lesson.keywords.map(b=>[b.id,b.answer])),choice:s.lesson.choice.correct,code:s.lesson.coding.fixtures.correct};
    await studyAction('answer',{id:s.id,kind:'keywords',...draft},'zh');await studyAction('answer',{id:s.id,kind:'choice',...draft},'zh');
    if(topicId==='react.props'||topicId==='postgresql.constraints'){
      const result=await studyAction('answer',{id:s.id,kind:'code',...draft},'zh') as StudyPayload;
      if(!result.session.attempts.at(-1)?.accepted)throw new Error(`Correct code rejected: ${JSON.stringify(result.session.attempts.at(-1))}`);
      if(topicId==='react.props'){
        const wrong=await studyAction('answer',{id:s.id,kind:'code',...draft,code:s.lesson.coding.fixtures.incorrect},'zh') as StudyPayload;
        if(wrong.session.attempts.at(-1)?.accepted)throw new Error('Broken React code accepted');
        const synonym={...s,id:randomUUID(),createdAt:new Date().toISOString(),attempts:[],helped:[]};
        synonym.lesson=structuredClone(s.lesson);synonym.lesson.keywords=[{id:'k1',prompt:'A repeated operation has no further effect: it is ____.',answer:'idempotent',aliases:[],explanation:'Repeating the operation has the same effect as one application.'},{id:'k2',prompt:'Change a copy without mutating the original: use an ____ update.',answer:'immutable',aliases:[],explanation:'Old data stays unchanged.'}];
        saveStudy(synonym);
        const same=await studyAction('answer',{id:synonym.id,kind:'keywords',...draft,keywords:{k1:'idempotence',k2:'non-mutating'}},'zh') as StudyPayload;
        if(!same.session.attempts.at(-1)?.accepted)throw new Error(`Synonym rejected: ${JSON.stringify(same.session.attempts.at(-1))}`);
        const opposite=await studyAction('answer',{id:synonym.id,kind:'keywords',...draft,keywords:{k1:'not idempotent',k2:'immutable'}},'zh') as StudyPayload;
        if(opposite.session.attempts.at(-1)?.accepted)throw new Error('Opposite meaning accepted');
        console.log(JSON.stringify({synonymsAccepted:true,oppositeMeaningRejected:true,correctCodeAccepted:true,brokenCodeRejected:true}));
      }
    }
    console.log(JSON.stringify({topicId,validated:true}));
  }
}finally{db.close();}
