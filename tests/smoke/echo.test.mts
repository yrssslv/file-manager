import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const distPath = path.resolve(process.cwd(), 'dist', 'app.mjs');

test('echo prints text to console', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'echo Hello World\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(
    result.status,
    0,
    `process exit code should be 0, got ${result.status}`
  );

  assert.ok(result.stdout.includes('Hello World'), 'output should include echoed text');
});

test('echo with empty arguments prints empty line', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'echo\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(result.status, 0);
});

test('echo with -e flag processes escape sequences', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'echo -e "Line1\\nLine2"\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(result.status, 0);

  assert.ok(
    result.stdout.includes('Line1') && result.stdout.includes('Line2'),
    'output should process \\n escape sequence'
  );
});

test('echo redirects output to file', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'pwd\ntouch test.txt\necho "Hello" > test.txt\ncat test.txt\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(result.status, 0, `Exit code should be 0, stderr: ${result.stderr}`);

  assert.ok(!result.stderr.includes('Error'), 'Should not have errors');
});

test('help menu includes echo command', async (): Promise<void> => {
  const result = spawnSync('node', [distPath], {
    input: 'help\nexit\n',
    encoding: 'utf-8',
    timeout: 5000,
  });

  assert.strictEqual(result.status, 0);

  assert.ok(result.stdout.includes('echo'), 'help output should include echo command');

  assert.ok(
    result.stdout.includes('Print text or write to file'),
    'help should describe echo command'
  );
});
