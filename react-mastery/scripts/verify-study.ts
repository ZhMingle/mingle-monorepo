// Real Codex checks in an isolated database; never learner progress.
process.env.DATA_DIR='data/choice-code-smoke';
const {db}=await import('../server/store.ts');
const {studyAction,getStudy}=await import('../server/study.ts');
import type {StudyPayload} from '../shared/study.ts';
try {
  const performanceCareer=process.argv.includes('--performance-career');
  const dataServices=process.argv.includes('--data-services');
  const marketing=process.argv.includes('--marketing');
  const topics=process.argv.includes('--behavioral')?['behavioral-interviews.ownership']:performanceCareer?['frontend-performance.search','backend-performance.cache-aside','behavioral-interviews.ownership']:process.argv.includes('--languages')?['java.types','python.values','go.values']:process.argv.includes('--all')?['react.props','typescript.inference','html-css.box-model','dotnet.types','nodejs.runtime','java.types','python.values','go.values','mysql.joins','sqlserver.indexes','postgresql.constraints']:['react.props','postgresql.constraints'];
  for(const topicId of marketing?['marketing-fundamentals.roas','google-ads.match-types','seo.robots','marketing-analytics.data-layer','ecommerce-marketing.cro','ai-search-reporting.ai-overviews']:dataServices?['redis.expiry','elasticsearch.text-keyword','spring.proxies']:topics){
    const payload=await studyAction('new',{topicId},'zh') as StudyPayload;const s=getStudy(payload.session.id);
    if(s.lesson.keywords.length||s.current!=='choice')throw Error('New lesson still has keyword blanks');
    const sample=(value:string)=>s.lesson.coding.format==='response'?value.replace(/^[^\n]*[：:]\s*\n+/, ''):value;
    const draft={...s.draft,choice:s.lesson.choice.correct,code:sample(s.lesson.coding.fixtures.correct)};
    await studyAction('answer',{id:s.id,kind:'choice',...draft},'zh');
    if(marketing||dataServices||performanceCareer||process.argv.includes('--behavioral')||topicId==='postgresql.constraints'||topicId==='nodejs.runtime'||['java.types','python.values','go.values'].includes(topicId)){
      const correct=await studyAction('answer',{id:s.id,kind:'code',...draft},'zh') as StudyPayload;
      if(!correct.session.attempts.at(-1)?.accepted)throw Error('Correct code rejected');
      const wrong=await studyAction('answer',{id:s.id,kind:'code',...draft,code:sample(s.lesson.coding.fixtures.incorrect)},'zh') as StudyPayload;
      if(wrong.session.attempts.at(-1)?.accepted)throw Error('Incorrect code accepted');
    }
    console.log(JSON.stringify({topicId,id:s.id,version:s.version,keywordCount:s.lesson.keywords.length,execution:s.lesson.coding.format==='response'?'AI response feedback':s.lesson.coding.execution?'browser':'AI review',validated:true}));
  }
} finally {db.close();}
