import test from 'node:test';
import assert from 'node:assert/strict';
import { learningPaths, findLearningPath } from '../shared/paths.ts';

test('catalog includes all requested paths with complete bilingual study guides',()=>{
  assert.deepEqual(learningPaths.map(p=>p.id),['react','typescript','html-css','dotnet','nodejs','mysql','sqlserver','postgresql']);
  const ids=new Set<string>();
  for(const path of learningPaths){
    assert.ok(path.name.en && path.name.zh && path.prerequisite.en && path.prerequisite.zh);
    assert.deepEqual(path.stages.map(s=>s.id),['foundation','practice','advanced']);
    for(const stage of path.stages){
      assert.ok(stage.project.en && stage.project.zh);
      assert.equal(stage.topics.length,path.id==='react'?2:4);
      for(const topic of stage.topics){
        assert.ok(!ids.has(topic.id));ids.add(topic.id);
        for(const field of [topic.title,topic.goal,topic.check])assert.ok(field.en && field.zh);
        assert.ok(['react.dev','www.typescriptlang.org','developer.mozilla.org','learn.microsoft.com','dev.mysql.com','www.postgresql.org','nodejs.org'].includes(new URL(topic.source).hostname));
      }
    }
  }
  assert.equal(ids.size,90);
  assert.equal(findLearningPath('missing'),undefined);
  assert.equal(findLearningPath('postgresql')?.category,'database');
});
