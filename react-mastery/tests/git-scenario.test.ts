import test from 'node:test';
import assert from 'node:assert/strict';
import {readableGitScenario} from '../shared/git-scenario.ts';

test('Git setup and completed actions are separated without revealing final state',()=>{
  const source='# 初始历史：A（唯一提交）\n# HEAD -> main -> A；没有远程仓库。\n# A 中 note.txt 的内容为 one，末尾有换行。\n# 初始暂存区和工作区均与 A 相同。\n# 以下编辑操作均已完成，未运行其他 Git 命令：\n# 1. 将 note.txt 改为 two 并保存，末尾有换行。\ngit add note.txt\n# 2. 将 note.txt 改为 three 并保存，末尾有换行。';
  const result=readableGitScenario(source)!;
  assert.equal(result.initial.length,4);
  assert.equal(result.introduction[0].scenario,'以下编辑操作均已完成，未运行其他 Git 命令：');
  assert.deepEqual(result.steps,[{scenario:'将 note.txt 改为 two 并保存，末尾有换行。'},{code:'git add note.txt'},{scenario:'将 note.txt 改为 three 并保存，末尾有换行。'}]);
  assert.ok(!JSON.stringify(result).includes('git commit'));
  assert.equal(result.initial[1].scenario,'HEAD -> main -> A；没有远程仓库。');
});

test('command arguments, quotes and adjacent commands remain unchanged',()=>{
  const source='# Initial state: branch main\n# Operations already performed:\n# Step 1: Stage the file\ngit add "file #1.txt"\ngit diff --cached -- "file #1.txt"';
  const result=readableGitScenario(source)!;
  assert.equal(result.steps[1].code,'git add "file #1.txt"\ngit diff --cached -- "file #1.txt"');
  assert.equal(readableGitScenario('```sh\n'+source+'\n```')?.steps[1].code,result.steps[1].code);
});

test('complex shell blocks fall back rather than changing the meaning of file contents',()=>{
  assert.equal(readableGitScenario("cat <<'EOF'\n# file content, not a comment\nEOF"),null);
  assert.equal(readableGitScenario('# Only initial state supplied'),null);
});
