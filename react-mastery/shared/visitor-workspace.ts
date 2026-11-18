import {lessons} from './curriculum.ts';
import {learningPaths} from './paths.ts';
import {learningOverview} from './learning-progress.ts';
import type {Bootstrap} from './types.ts';

// Authored curriculum is shared. Personal records never enter this projection.
export function visitorBootstrap(): Bootstrap {
  return {
    storage: 'browser',
    lessons: lessons.map(({prediction: _, ...lesson}) => lesson),
    progress: [], sessions: [], now: new Date().toISOString(),
    connection: {available: false, provider: 'Clarity', message: 'AI is not connected to this browser. Personal learning records are private. / 当前浏览器未连接 AI，个人学习记录保持私密。'},
  };
}

export function visitorOverview() { return learningOverview(learningPaths, [], []); }

export const visitorWorkspace = {bootstrap: visitorBootstrap, overview: visitorOverview};
