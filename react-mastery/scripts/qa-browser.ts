import { runCode } from '../src/sandbox.ts';
import { lessons, challengeFor } from '../shared/curriculum.ts';
import { solutionFor } from '../tests/solutions.ts';
import { codeReferenceFor } from '../server/code-support.ts';
const output = document.getElementById('results')!;
document.getElementById('run')!.addEventListener('click', async () => {
  output.textContent = 'Running isolated React exercises...\n';
  let failed = 0;
  for (const lesson of lessons) {
    for (const variant of [0, 1]) for (const transfer of [false, true]) {
      try {
        const result = await runCode(challengeFor(lesson.id, variant, transfer), codeReferenceFor(lesson.id, variant, transfer).code);
        if (!result.passed) failed++;
        output.textContent += `${result.passed ? 'PASS' : 'FAIL'} reference ${lesson.id} variant ${variant} ${transfer ? 'transfer' : 'primary'}: ${result.tests.filter(t => t.passed).length}/4\n`;
      } catch (e) { failed++; output.textContent += `FAIL reference ${lesson.id}: ${(e as Error).message}\n`; }
    }
    for (const transfer of [false, true]) {
      try {
        const result = await runCode(challengeFor(lesson.id, 0, transfer), solutionFor(lesson.id, transfer));
        if (!result.passed) failed++;
        output.textContent += `${result.passed ? 'PASS' : 'FAIL'} ${lesson.id} ${transfer ? 'transfer' : 'primary'}: ${result.tests.filter(t => t.passed).length}/4\n`;
        if (!result.passed) output.textContent += result.tests.filter(t => !t.passed).map(t => `  ${t.detail}`).join('\n') + '\n';
      } catch (e) { failed++; output.textContent += `FAIL ${lesson.id}: ${(e as Error).message}\n`; }
    }
    const broken = await runCode(challengeFor(lesson.id, 0), challengeFor(lesson.id, 0).starter);
    if (broken.passed) failed++;
    output.textContent += `${broken.passed ? 'FAIL' : 'PASS'} ${lesson.id}: broken starter is rejected\n`;
  }
  const loop = await runCode(challengeFor('props', 0), 'function Exercise(){ while(true){} return null; }');
  if (loop.passed) failed++;
  output.textContent += `${!loop.passed ? 'PASS' : 'FAIL'} loop guard\n`;
  output.textContent += failed ? `FAILED: ${failed} case(s)` : 'ALL 43 SANDBOX CASES PASSED';
});
