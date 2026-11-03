import test from 'node:test';
import assert from 'node:assert/strict';
import { learningOverview,topicNeighbors,resumePath } from '../shared/learning-progress.ts';
import { learningPaths,findLearningPath } from '../shared/paths.ts';
import type { StudySession,StudyAttempt } from '../shared/study.ts';
import type { LearningSession } from '../shared/types.ts';
const attempt=(kind:StudyAttempt['kind'],accepted=true,error?:string):StudyAttempt=>({kind,accepted,error,input:'test',at:'2026-10-26',supported:false});
const session=(topicId:string,attempts:StudyAttempt[]):StudySession=>({topicId,attempts} as StudySession);

test('progress counts distinct choice/code evidence across variations, not browsing or keyword history',()=>{
  const records=[session('react.props',[attempt('choice'),attempt('choice')]),session('react.props',[]),session('react.props',[attempt('code')]),session('react.snapshot',[attempt('keywords'),attempt('choice',false),attempt('code',true,'Connection failed')]),session('unknown.topic',[attempt('choice'),attempt('code')])];
  const p=learningOverview(learningPaths,records);
  assert.deepEqual(p.paths.react.topics['react.props'].kinds,['choice','code']);
  assert.equal(p.paths.react.completedChecks,2);assert.equal(p.paths.react.totalChecks,36);assert.equal(p.paths.react.completedTopics,1);
  assert.equal(p.paths.react.topics['react.snapshot'].completed,0);
  assert.equal(p.paths.react.topics['react.snapshot'].started,true);
  assert.equal(p.paths.react.topics['react.keys'].started,false);
  assert.equal(p.overall.completedChecks,2);assert.equal(p.overall.totalChecks,1044);assert.equal(p.overall.totalTopics,522);
  assert.equal(p.overall.completedTopics,1);
  assert.equal(p.paths.nodejs.totalChecks,48);
  assert.equal(p.paths.nodejs.completedChecks,0);
  assert.deepEqual(learningOverview(learningPaths,[...records,session('react.props',[])]),p);
});
test('original React choice and executable-code completions count without duplication or granting mastery',()=>{
  const legacy=[{lessonId:'props',prediction:{correct:true},build:{passed:true}},{lessonId:'snapshot',prediction:{correct:false},build:{passed:true}}] as LearningSession[];
  const p=learningOverview(learningPaths,[session('react.props',[attempt('code')])],legacy);
  assert.equal(p.paths.react.completedChecks,3);assert.equal(p.paths.react.completedTopics,1);assert.equal(p.paths.react.percent,8);
  assert.equal('mastered' in p.paths.react,false);
});
test('topic navigation follows the curriculum across phase boundaries and handles both ends',()=>{
  const react=findLearningPath('react')!;const first=topicNeighbors(react,'react.props');
  assert.equal(first.previous,null);assert.equal(first.next?.id,'react.snapshot');assert.equal(first.index,0);
  const boundary=topicNeighbors(react,'react.delivery-contract');assert.equal(boundary.next?.id,'react.immutable');
  const last=topicNeighbors(react,'react.change-review');assert.equal(last.next,null);assert.equal(last.previous?.id,'react.external-store');
  assert.equal(topicNeighbors(react,'missing').next,null);
  assert.equal(topicNeighbors(findLearningPath('typescript')!,'typescript.generics').previous?.id,'typescript.delivery-contract');
  assert.equal(topicNeighbors(findLearningPath('nodejs')!,'nodejs.file-data').next?.id,'nodejs.blocking-work');
});

test('progress shortcut resumes the first unfinished topic and remaining question type',()=>{
  const path=findLearningPath('react')!;
  const records=[session('react.props',[attempt('choice'),attempt('code')]),session('react.snapshot',[attempt('choice')])];
  assert.equal(resumePath(path,learningOverview([path],records).paths.react),'#roadmap/react/react.snapshot/code');
  assert.equal(resumePath(path,learningOverview([path],[]).paths.react),'#roadmap/react/react.props/choice');
  assert.equal(resumePath(path,learningOverview([path],[session('react.props',[attempt('code')])]).paths.react),'#roadmap/react/react.props/choice');
  const complete=path.stages.flatMap(stage=>stage.topics).map(topic=>session(topic.id,[attempt('choice'),attempt('code')]));
  assert.equal(resumePath(path,learningOverview([path],complete).paths.react),'#roadmap/react');
});