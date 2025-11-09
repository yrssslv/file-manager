import { spawn, ChildProcess } from 'node:child_process';

export function runCli(
  appPath: string,
  commands: string[],
  opts: { cwd?: string; env?: NodeJS.ProcessEnv; timeoutMs?: number } = {}
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  const { cwd, env, timeoutMs = 8000 } = opts;
  return new Promise((resolve, reject) => {
    const child: ChildProcess = spawn(process.execPath, [appPath], {
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

    child.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString();
    });
    child.on('error', (err: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code: number | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });

    const lines = Array.isArray(commands) ? commands.slice() : [];
    let i = 0;
    const writeNext = (): void => {
      if (i >= lines.length) return;
      const line = String(lines[i++] || '');
      child.stdin?.write(line + '\n');
      setTimeout(writeNext, 200);
    };
    setTimeout(writeNext, 100);
  });
}
