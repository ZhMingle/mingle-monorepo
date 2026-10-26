import { frontendPaths } from './paths-frontend.ts';
import { backendPaths } from './paths-backend.ts';
import { databasePaths } from './paths-databases.ts';
export const pathsVersion = '2026.10.1';
export const learningPaths = [...frontendPaths, ...backendPaths, ...databasePaths];
export function findLearningPath(id:string) { return learningPaths.find(path=>path.id===id); }
