import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

export function info(msg) {
  console.log(chalk.blue('[INFO]'), msg);
}

export function warn(msg) {
  console.log(chalk.yellow('[WARNING]'), msg);
}

export function error(msg) {
  console.log(chalk.red('[ERROR]'), msg);
}

export function debug(msg) {
  if (process.env.DEBUG) {
    console.log(chalk.magenta('[DEBUG]'), msg);
  }
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
  fs.appendFile(logFilePath, logMsg, (err) => {
    if (err) {
      console.error('Failed to write log to file:', err);
    }
  });
}
