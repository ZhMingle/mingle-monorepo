import { writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const source = resolve(process.argv[2] || '../../react-mastery');
const { learningPaths, pathsVersion } = await import(pathToFileURL(resolve(source, 'shared/paths.ts')));
const { lessons } = await import(pathToFileURL(resolve(source, 'shared/curriculum.ts')));
const { translate } = await import(pathToFileURL(resolve(source, 'shared/i18n.ts')));
const bilingual = text => ({ en: text, zh: translate(text, 'zh') });
const publicLessons = lessons.map(lesson => ({
  id: lesson.id, title: bilingual(lesson.english), summary: bilingual(lesson.summary),
  takeaway: bilingual(lesson.takeaway), source: lesson.source, example: lesson.example,
  paragraphs: lesson.paragraphs.map(p => ({ title: bilingual(p.title), body: bilingual(p.body) })),
  prediction: { ...lesson.prediction[0], prompt: bilingual(lesson.prediction[0].prompt),
    choices: lesson.prediction[0].choices.map(bilingual), explanation: bilingual(lesson.prediction[0].explanation) },
}));
await mkdir('learning', { recursive: true });
await writeFile('learning/catalog.json', JSON.stringify({ version: pathsVersion, paths: learningPaths, lessons: publicLessons }));
console.log(`Exported ${learningPaths.length} authored paths and ${publicLessons.length} lessons. No learner records or generated AI content are exported.`);
