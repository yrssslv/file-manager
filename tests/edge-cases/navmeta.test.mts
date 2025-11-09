import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runCli } from '../helpers/run-cli.mjs';

const appPath: string = path.resolve(process.cwd(), 'dist/app.mjs');

async function makeTmpRoot(): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'fm-edge-'));
  return dir;
}

test('help displays help for unknown command', async (): Promise<void> => {
  const root = await makeTmpRoot();
  const { stdout, stderr, code } = await runCli(appPath, ['unknowncmd', 'exit'], {
    cwd: root,
    env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'info' },
  });

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.match(stdout, /Unknown command|Available commands|help/);
});

test('pwd works in subdirectory', async (): Promise<void> => {
  const root = await makeTmpRoot();
  await fs.mkdir(path.join(root, 'subdir'));
  const { stdout, stderr, code } = await runCli(appPath, ['cd subdir', 'pwd', 'exit'], {
    cwd: root,
    env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'info' },
  });

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.match(stdout, /Current directory:/);
  assert.match(stdout, /subdir/);
});

test('exit command terminates session', async (): Promise<void> => {
  const root = await makeTmpRoot();
  const { stdout, stderr, code } = await runCli(appPath, ['exit'], {
    cwd: root,
    env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'info' },
  });

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.match(stdout, /Goodbye|Exiting/);
});

test('empty command shows prompt again', async (): Promise<void> => {
  const root = await makeTmpRoot();
  const { stdout, stderr, code } = await runCli(appPath, ['', 'exit'], {
    cwd: root,
    env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'info' },
  });

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.doesNotMatch(stdout, /Unknown command|Error/);
});

test('command with only whitespace shows prompt again', async (): Promise<void> => {
  const root = await makeTmpRoot();
  const { stdout, stderr, code } = await runCli(appPath, ['   ', 'exit'], {
    cwd: root,
    env: { ALLOWED_ROOT_DIR: root, LOG_LEVEL: 'info' },
  });

  assert.equal(code, 0, `process exit code should be 0, got ${code}\nstderr: ${stderr}`);
  assert.doesNotMatch(stdout, /Unknown command|Error/);
});
