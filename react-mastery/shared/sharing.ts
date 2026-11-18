import {findLearningPath} from './paths.ts';

export const learningSiteOrigin = 'https://clarity-learning-lab-mingle.minglezhang7.chatgpt.site';

// Share curriculum only. Never carry the private workspace query or a session ID.
export function learningShareUrl(pathId = '') {
  const path = findLearningPath(pathId);
  return `${learningSiteOrigin}/#roadmap${path ? `/${path.id}` : ''}`;
}
