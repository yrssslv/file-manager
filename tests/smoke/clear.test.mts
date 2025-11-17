import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const distPath = path.resolve(process.cwd(), 'dist', 'app.mjs');

test('clear command executes without errors', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'clear\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(
    result.status,
    0,
    `process exit code should be 0, got ${result.status}\nstderr: ${result.stderr}`
  );

  assert.ok(!result.stderr.includes('Error'), 'stderr should not contain errors');
});

test('help menu includes clear command', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'help\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(
    result.status,
    0,
    `process exit code should be 0, got ${result.status}`
  );

  assert.ok(result.stdout.includes('clear'), 'help output should include clear command');

  assert.ok(
    result.stdout.includes('Clear terminal screen'),
    'help should describe clear command'
  );
});
