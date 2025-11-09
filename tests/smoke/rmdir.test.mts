import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runCli } from '../helpers/run-cli.mjs';

const appPath: string = path.resolve(process.cwd(), 'dist/app.mjs');

async function makeTmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fm-smoke-'));
  return dir;
}

async function setupNested(root: string, dir: string = 'nested'): Promise<string> {
  const nested = path.join(root, dir, 'child');
  await fs.mkdir(nested, { recursive: true });
  await fs.writeFile(path.join(nested, 'file.txt'), 'x');
  return dir;
}

test('rmdir -r prompts and cancels when answered no', async (): Promise<void> => {
  const root = await makeTmpRoot();
  const targetDir = await setupNested(root, 'to-del');
  const { stdout, stderr, code } = await runCli(
    appPath,
    [`rmdir -r ${targetDir}`, 'n', 'ls', 'exit'],
    { cwd: root, env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'info' } }
  );

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.match(stdout, /Proceed\? \[y\/N\]/i);
  assert.match(stdout, /cancelled/i);
  assert.match(stdout, /to-del\//);
});

test('rmdir -r --yes deletes recursively without prompting', async (): Promise<void> => {
  const root = await makeTmpRoot();
  const targetDir = await setupNested(root, 'fast-del');
  const { stdout, stderr, code } = await runCli(
    appPath,
    [`rmdir -r --yes ${targetDir}`, 'ls', 'exit'],
    { cwd: root, env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'info' } }
  );

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.doesNotMatch(stdout, /Proceed\? \[y\/N\]/i);
  assert.match(stdout, /Directory removed recursively: fast-del/);
  assert.match(stdout, /Directory is empty\./);
});
