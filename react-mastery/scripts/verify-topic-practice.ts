// Real Codex smoke checks in isolated data; never creates learner progress.
import { randomUUID } from 'node:crypto';
process.env.DATA_DIR='data/topic-smoke';
const {db}=await import('../server/store.ts');
const {topicAction,getTopic,saveTopic}=await import('../server/topic-practice.ts');
const {topicAttemptPassed,topicStatus}=await import('../shared/topic-practice.ts');
import type {TopicPayload} from '../shared/topic-practice.ts';
try {
  for(const topicId of ['typescript.inference','html-css.box-model','dotnet.types','mysql.joins','sqlserver.indexes','postgresql.maintenance']) {
    const payload=await topicAction('new',{topicId},'zh') as TopicPayload;
    const s=getTopic(payload.session.id);
    console.log(JSON.stringify({topicId,id:s.id,overview:s.lesson.overview,try:s.lesson.tasks.try,transfer:s.lesson.tasks.transfer}));
    if(topicId==='typescript.inference'){
      for(const step of ['try','transfer'] as const){
        const task=s.lesson.tasks[step];
        await topicAction('answer',{id:s.id,step,choice:task.correct,reason:task.fixtures.correctReason},'zh');
        const saved=getTopic(s.id);if(!topicAttemptPassed(saved,step,saved.attempts[step].at(-1)!))throw new Error(`Correct fixture rejected for ${step}`);
      }
      if(topicStatus(getTopic(s.id))!=='first-proof')throw new Error('Independent evidence missing');
      const guess={...s,id:randomUUID(),createdAt:new Date().toISOString(),attempts:{try:[],transfer:[]},helped:[]};saveTopic(guess);
      await topicAction('answer',{id:guess.id,step:'try',choice:s.lesson.tasks.try.correct,reason:'TypeScript is a strongly typed language. We should use best practices and avoid bugs.'},'zh');
      const saved=getTopic(guess.id);if(topicAttemptPassed(saved,'try',saved.attempts.try.at(-1)!))throw new Error('Generic recall was accepted');
      console.log(JSON.stringify({correctReasoningAccepted:true,genericRecallRejected:true}));
    }
  }
}finally{db.close();}
