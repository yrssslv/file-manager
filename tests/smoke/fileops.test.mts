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

test('touch/ls/rm file lifecycle works', async (): Promise<void> => {
  const root = await makeTmpRoot();
  const { stdout, stderr, code } = await runCli(
    appPath,
    ['touch a.txt', 'ls', 'rm a.txt', 'ls', 'exit'],
    { cwd: root, env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'info' } }
  );

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.match(stdout, /File created successfully\./);
  assert.match(stdout, /a\.txt/);
  assert.match(stdout, /File deleted successfully\./);
  assert.match(stdout, /Directory is empty\./);
});
