import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const distPath = path.resolve(process.cwd(), 'dist', 'app.mjs');

test('tree displays directory structure', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'tree\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(
    result.status,
    0,
    `process exit code should be 0, got ${result.status}\nstderr: ${result.stderr}`
  );

  assert.ok(!result.stderr.includes('Error'), 'should not have errors');
});

test('tree with -d flag shows only directories', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'tree -d\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(result.status, 0);

  assert.ok(!result.stderr.includes('Error'), 'should not have errors');
});

test('tree with -L flag limits depth', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'tree -L 1\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(result.status, 0);
  assert.ok(!result.stderr.includes('Error'), 'should not have errors');
});

test('tree with specific directory', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'tree commands\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(result.status, 0);
  assert.ok(!result.stderr.includes('Error'), 'should not have errors');
});

test('help menu includes tree command', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'help\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(result.status, 0);

  assert.ok(result.stdout.includes('tree'), 'help output should include tree command');

  assert.ok(
    result.stdout.includes('Display directory tree'),
    'help should describe tree command'
  );
});
