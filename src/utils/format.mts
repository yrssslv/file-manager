import chalk from 'chalk';
import path from 'node:path';

function toMessage(value: unknown): string {
  if (value instanceof Error) {
    return value.message || value.name || 'Error';
  }
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (value && typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object Object]';
    }
  }
  if (value === null || value === undefined) return '';
  return String(value);
}

export function formatError(
  messageOrError: string | Error | unknown,
  error?: Error | unknown
): string {
  let primary = '';
  let secondary = '';

  if (typeof messageOrError === 'string') {
    primary = messageOrError;
  } else if (messageOrError instanceof Error) {
    primary = toMessage(messageOrError);
    if (!error) {
      secondary = messageOrError.stack || '';
    }
  } else if (messageOrError !== undefined) {
    primary = toMessage(messageOrError);
  }

  if (error instanceof Error) {
    secondary = error.message || error.stack || '';
  } else if (error !== undefined) {
    secondary = toMessage(error);
  }

  if (secondary.includes('\n')) {
    const lines = secondary.split('\n');
    secondary = lines[0] || '';
  }

  const parts = [primary, secondary]
    .map((part: string) => (part ? part.trim() : ''))
    .filter(Boolean);

  const message = parts.join(': ') || 'Unknown error';
  return message;
}

export function formatSize(bytes: number): string {
  const units: string[] = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return chalk.blue(`${size.toFixed(2)} ${units[i]}`);
}

export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  };
  const formatted = date.toLocaleString(undefined, options);
  return chalk.green(formatted);
}

export function formatList(items: string[]): string {
  const maxLength = Math.max(...items.map((item: string) => item.length));
  return items
    .map((item: string, index: number) => {
      const padded = item.padEnd(maxLength, ' ');
      return chalk.cyan(`${index + 1}.`) + ' ' + chalk.yellow(padded);
    })
    .join('\n');
}

export function resolvePath(p: string, base: string = process.cwd()): string {
  return path.resolve(base, p);
}

export function formatCommandList(
  commands: Array<{ cmd: string; usage: string; desc: string }>
): string {
  if (!Array.isArray(commands) || commands.length === 0) return '';
  const cmdLen = Math.max(
    ...commands.map((c: { cmd: string; usage: string; desc: string }) => c.cmd.length)
  );
  const usageLen = Math.max(
    ...commands.map((c: { cmd: string; usage: string; desc: string }) => c.usage.length)
  );
  return commands
    .map(
      ({ cmd, usage, desc }: { cmd: string; usage: string; desc: string }) =>
        chalk.cyan(cmd.padEnd(cmdLen, ' ')) +
        '  ' +
        chalk.green(usage.padEnd(usageLen, ' ')) +
        '  ' +
        chalk.yellow(desc)
    )
    .join('\n');
}

export function formatNameDesc(
  items: Array<{ name: string; description: string }>,
  { minWidth = 0 }: { minWidth?: number } = {}
): string {
  if (!Array.isArray(items) || items.length === 0) return '';
  const localMax = Math.max(
    ...items.map(
      (i: { name: string; description: string } | undefined) => (i?.name || '').length
    ),
    0
  );
  const padWidth = Math.max(localMax, minWidth);
  return items
    .map((i: { name: string; description: string } | undefined) => {
      const name = String(i?.name || '');
      const desc = String(i?.description || '');
      return `  ${chalk.cyan(name.padEnd(padWidth, ' '))}  ${chalk.gray(desc)}`;
    })
    .join('\n');
}
