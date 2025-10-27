import { spawn } from 'node:child_process';

/**
 * Spawns the CLI and runs a sequence of commands, capturing stdout/stderr.
 * @param {string} appPath Absolute path to app.mjs
 * @param {string[]} commands Lines to send to stdin (without trailing newlines)
 * @param {{ cwd?: string, env?: NodeJS.ProcessEnv, timeoutMs?: number }} [opts]
 * @returns {Promise<{ stdout: string, stderr: string, code: number|null }>}
 */
export function runCli(appPath, commands, opts = {}) {
  const { cwd, env, timeoutMs = 8000 } = opts;
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [appPath], {
      cwd,
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      try {
        child.kill();
      } catch {}
      reject(new Error('CLI test timed out'));
    }, timeoutMs);

    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });

    const lines = Array.isArray(commands) ? commands.slice() : [];
    let i = 0;
    const writeNext = () => {
      if (i >= lines.length) return;
      const line = String(lines[i++] || '');
      child.stdin.write(line + '\n');
      setTimeout(writeNext, 120);
    };
    writeNext();
  });
}
