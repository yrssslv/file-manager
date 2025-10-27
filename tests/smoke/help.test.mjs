import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runCli } from '../helpers/run-cli.mjs';

const appPath = path.resolve(process.cwd(), 'app.mjs');

async function makeTmpRoot() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fm-smoke-'));
  return dir;
}

test('help menu renders and lists commands', async () => {
  const root = await makeTmpRoot();
  const { stdout, stderr, code } = await runCli(appPath, ['help', 'exit'], {
    cwd: root,
    env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'error' },
  });

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.match(stdout, /File Manager CLI (—|-) Help/);
  assert.match(stdout, /help/i);
  assert.match(stdout, /exit/i);
  assert.match(stdout, /Usage: help - Show help/);
});
