import chalk from 'chalk';
import path from 'path';

export function formatError(err) {
  let message;
  if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === 'string') {
    message = err;
  } else if (typeof err === 'object' && err !== null) {
    message = JSON.stringify(err);
  } else {
    message = String(err);
  }
  return chalk.red(`[ERROR] ${message}`);
}

export function formatSize(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return chalk.blue(`${size.toFixed(2)} ${units[i]}`);
}

export function formatDate(date) {
  const options = {
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

export function formatList(items) {
  const maxLength = Math.max(...items.map((item) => item.length));
  return items
    .map((item, index) => {
      const padded = item.padEnd(maxLength, ' ');
      return chalk.cyan(`${index + 1}.`) + ' ' + chalk.yellow(padded);
    })
    .join('\n');
}

export function formatPath(p, base = process.cwd()) {
  return path.resolve(base, p);
}
