import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

// Log levels and filtering
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };
let CURRENT_LEVEL =
  LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] || LEVELS.info;

export function setLevel(levelName) {
  const lvl = LEVELS[(levelName || '').toLowerCase()];
  if (lvl) CURRENT_LEVEL = lvl;
}

function shouldLog(level) {
  return level >= CURRENT_LEVEL;
}

export function info(msg) {
  if (!shouldLog(LEVELS.info)) return;
  console.log(chalk.blue('[INFO]'), msg);
}

export function warn(msg) {
  if (!shouldLog(LEVELS.warn)) return;
  console.log(chalk.yellow('[WARNING]'), msg);
}

export function error(msg) {
  if (!shouldLog(LEVELS.error)) return;
  console.log(chalk.red('[ERROR]'), msg);
}

export function debug(msg) {
  if (!shouldLog(LEVELS.debug)) return;
  console.log(chalk.magenta('[DEBUG]'), msg);
}

export function help(msg) {
  console.log(chalk.green('[HELP]'), msg);
}

function getTime() {
  const now = new Date();
  return now.toISOString();
}

export function plain(msg) {
  console.log(`[${getTime()}]`, msg);
}
const logFilePath = path.resolve(process.cwd(), 'app.log');

export function logToFile(msg, level = 'INFO') {
  const time = new Date().toISOString();
  const logMsg = `[${time}] [${level}] ${msg}\n`;
  // Use fs.appendFile (callback) to avoid recursive calls to our own logger.
  fs.appendFile(logFilePath, logMsg, (err) => {
    if (err) {
      // Intentionally using console.error here to avoid recursion into logger.error
      console.error('Failed to write log to file:', err);
    }
  });
}
