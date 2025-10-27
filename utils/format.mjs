import chalk from 'chalk';
import path from 'node:path';

/**
 * Normalizes any value into a human-readable string.
 * @param {unknown} value - Value to represent.
 * @returns {string} String representation suitable for logs.
 */
function toMessage(value) {
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

/**
 * Formats an error message for consistent CLI output.
 * Accepts either a single error-like value or a descriptive message plus an error.
 * @param {string | Error | unknown} messageOrError - Primary message or error payload.
 * @param {Error | unknown} [error] - Optional error providing additional context.
 * @returns {string} Human-readable error message (without level prefix/color).
 */
export function formatError(messageOrError, error) {
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
    secondary = secondary.split('\n')[0];
  }

  const parts = [primary, secondary]
    .map((part) => (part ? part.trim() : ''))
    .filter(Boolean);

  const message = parts.join(': ') || 'Unknown error';
  // Do not add [ERROR] or color here; logger.error handles prefix/coloring.
  return message;
}

/**
 * Formats a byte size into a human-readable string with units.
 * @param {number} bytes - Size in bytes.
 * @returns {string} Chalk-colored size string.
 */
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

/**
 * Formats a Date instance using the current locale.
 * @param {Date} date - Date to format.
 * @returns {string} Chalk-colored date string.
 */
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

/**
 * Formats a list of items into a numbered multiline string.
 * @param {string[]} items - Items to list.
 * @returns {string} Chalk-colored multiline list.
 */
export function formatList(items) {
  const maxLength = Math.max(...items.map((item) => item.length));
  return items
    .map((item, index) => {
      const padded = item.padEnd(maxLength, ' ');
      return chalk.cyan(`${index + 1}.`) + ' ' + chalk.yellow(padded);
    })
    .join('\n');
}

/**
 * Resolves a possibly relative path against a base path.
 * @param {string} p - Path to resolve.
 * @param {string} [base=process.cwd()] - Base directory for resolution.
 * @returns {string} Absolute path.
 */
export function resolvePath(p, base = process.cwd()) {
  return path.resolve(base, p);
}

/**
 * Formats a list of commands with aligned columns.
 * @param {Array<{cmd: string, usage: string, desc: string}>} commands - Command objects.
 * @returns {string} Chalk-colored multiline command list.
 */
export function formatCommandList(commands) {
  if (!Array.isArray(commands) || commands.length === 0) return '';
  const cmdLen = Math.max(...commands.map((c) => c.cmd.length));
  const usageLen = Math.max(...commands.map((c) => c.usage.length));
  return commands
    .map(
      ({ cmd, usage, desc }) =>
        chalk.cyan(cmd.padEnd(cmdLen, ' ')) +
        '  ' +
        chalk.green(usage.padEnd(usageLen, ' ')) +
        '  ' +
        chalk.yellow(desc)
    )
    .join('\n');
}

/**
 * Formats a list of name/description pairs into aligned columns.
 * Useful for help menus where left column is a command name and right is a single-line description.
 * @param {Array<{name: string, description: string}>} items - Items to format.
 * @returns {string} Chalk-colored multiline text with aligned names.
 */
export function formatNameDesc(items, { minWidth = 0 } = {}) {
  if (!Array.isArray(items) || items.length === 0) return '';
  const localMax = Math.max(...items.map((i) => (i?.name || '').length), 0);
  const padWidth = Math.max(localMax, minWidth);
  return items
    .map((i) => {
      const name = String(i?.name || '');
      const desc = String(i?.description || '');
      return `  ${chalk.cyan(name.padEnd(padWidth, ' '))}  ${chalk.gray(desc)}`;
    })
    .join('\n');
}
