import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
let CURRENT_LEVEL =
  LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] || LEVELS.info;

const LOG_TO_FILE_ENABLED =
  typeof process.env.LOG_TO_FILE === 'string' &&
  process.env.LOG_TO_FILE.toLowerCase() === 'true';

const logFilePath = path.resolve(process.cwd(), 'app.log');

/**
 * Updates the active log level threshold using a case-insensitive name.
 * @param {string} levelName - Desired minimum log level (debug, info, warn, error).
 */
export function setLevel(levelName) {
  const lvl = LEVELS[(levelName || '').toLowerCase()];
  if (lvl) CURRENT_LEVEL = lvl;
}

function shouldLog(level) {
  return level >= CURRENT_LEVEL;
}

function logToFileIfEnabled(level, msg) {
  if (!LOG_TO_FILE_ENABLED) return;
  logToFile(msg, level);
}

function emit(levelName, colorFn, msg, consoleFn = console.log) {
  const numeric = LEVELS[levelName];
  if (numeric && !shouldLog(numeric)) return;
  consoleFn(colorFn(`[${levelName.toUpperCase()}]`), msg);
  logToFileIfEnabled(levelName.toUpperCase(), msg);
}

/**
 * Logs an informational message when the log level permits.
 * @param {string} msg - Message to emit.
 */
export function info(msg) {
  emit('info', chalk.blue, msg);
}

/**
 * Logs a warning message when the log level permits.
 * @param {string} msg - Message to emit.
 */
export function warn(msg) {
  emit('warn', chalk.yellow, msg);
}

/**
 * Logs an error message using stderr while honoring the configured level.
 * @param {string} msg - Message to emit.
 */
export function error(msg) {
  emit('error', chalk.red, msg, console.error);
}

/**
 * Logs a debug message when debug logging is enabled.
 * @param {string} msg - Message to emit.
 */
export function debug(msg) {
  emit('debug', chalk.magenta, msg);
}

/**
 * Logs help output without level filtering.
 * @param {string} msg - Message to emit.
 */
export function help(msg) {
  emit('help', chalk.green, msg);
}

function getTime() {
  const now = new Date();
  return now.toISOString();
}

/**
 * Emits an unformatted timestamped log line.
 * @param {string} msg - Message to emit.
 */
export function plain(msg) {
  const output = `[${getTime()}] ${msg}`;
  console.log(output);
  logToFileIfEnabled('PLAIN', output);
}

/**
 * Appends a log entry to the on-disk log file.
 * @param {string} msg - Message body to persist.
 * @param {string} [level='INFO'] - Log level label for the entry.
 */
export function logToFile(msg, level = 'INFO') {
  const time = new Date().toISOString();
  const logMsg = `[${time}] [${level}] ${msg}\n`;
  fs.appendFile(logFilePath, logMsg, (err) => {
    if (err) {
      console.error('Failed to write log to file:', err);
    }
  });
}
