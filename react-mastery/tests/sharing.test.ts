import test from 'node:test';
import assert from 'node:assert/strict';
import {learningPaths} from '../shared/paths.ts';
import {learningShareUrl, learningSiteOrigin} from '../shared/sharing.ts';

test('every share link opens curriculum without private workspace or session parameters', () => {
  for (const path of learningPaths) {
    const url = new URL(learningShareUrl(path.id));
    assert.equal(url.origin, learningSiteOrigin);
    assert.equal(url.search, '');
    assert.equal(url.hash, `#roadmap/${path.id}`);
  }
  for (const invalid of ['', 'unknown', '../api/export', 'react?workspace=1']) {
    assert.equal(learningShareUrl(invalid), `${learningSiteOrigin}/#roadmap`);
  }
});
