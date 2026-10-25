// Real model smoke checks in a separate database; never seeds learner mastery.
import {mkdtempSync,rmSync,rmdirSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const scratch=mkdtempSync(join(tmpdir(),'clarity-understanding-live-'));process.env.DATA_DIR=scratch;
const {db}=await import('../server/store.ts');
const {createUnderstanding,saveUnderstanding,understandingAction}=await import('../server/understanding.ts');
try {
  const guess=createUnderstanding();guess.seed=0;saveUnderstanding(guess);
  const bad=await understandingAction('answer',{id:guess.id,probe:'predict',outcomes:[3],choice:'',explanation:'React batches asynchronous state updates and functional updates are best practice.'},'zh');
  if(bad.evidence[0].verified)throw Error('A generic memorized slogan was accepted.');
  const s=createUnderstanding();s.seed=1;saveUnderstanding(s);
  const responses=[
    {probe:'predict',outcomes:[4],choice:'',explanation:'Both setter calls read count=3 from the render that created this handler. Each queues replacement with 4, so the next render shows 4. The setter does not change the local count variable.'},
    {probe:'change',outcomes:[12,18],choice:'',explanation:'In A, the queue starts at 3, the first updater produces 5, then the captured count+1 replaces that with 4, and multiplying by 3 gives 12. In B, replacing with 4 happens first, then adding 2 gives 6 and multiplying gives 18. Functions use the previous queued result; the replacement reads the original snapshot.'},
    {probe:'repair',outcomes:[7],choice:'updaters',explanation:'The two updater functions compose: starting from 3, adding step=3 gives 6, then adding 1 gives 7. Each receives the previous queued result. Direct replacement is appropriate for an independent value, such as setting text to event.target.value or resetting count to zero; not every setter needs a function.'}
  ];
  let payload;
  for(const response of responses){payload=await understandingAction('answer',{id:s.id,...response},'zh');if(!payload.evidence.find(e=>e.id===response.probe)?.verified)throw Error(`Correct reasoning rejected for ${response.probe}: ${JSON.stringify(payload.session?.attempts)}`);payload=await understandingAction('advance',{id:s.id,probe:response.probe},'zh');}
  if(payload?.evidence.filter(e=>e.independent).length!==3||!payload.session?.reviewAt)throw Error('Independent evidence or delayed review missing.');
  console.log(JSON.stringify({genericRecallRejected:true,independentProbes:3,delayedReviewScheduled:true,feedbackLanguage:'zh'},null,2));
} finally {
  db.close();
  for(const name of ['learning.sqlite','learning.sqlite-wal','learning.sqlite-shm'])rmSync(join(scratch,name),{force:true});
  const coach=join(scratch,'coach');if(existsSync(coach)){for(const name of readdirSync(coach))rmSync(join(coach,name));rmdirSync(coach);}rmdirSync(scratch);
}
