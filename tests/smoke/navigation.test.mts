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

test('pwd prints current directory inside allowed root', async (): Promise<void> => {
  const root = await makeTmpRoot();
  const { stdout, stderr, code } = await runCli(appPath, ['pwd', 'exit'], {
    cwd: root,
    env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'info' },
  });

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.match(stdout, /Current directory:/);
  assert.match(stdout, new RegExp(root.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
