import chalk from 'chalk';
import fs from 'node:fs';
import path from 'node:path';

const LEVELS: Record<string, number> = { debug: 10, info: 20, warn: 30, error: 40 };
let CURRENT_LEVEL: number = (LEVELS[
  (process.env.LOG_LEVEL || 'info').toLowerCase() as keyof typeof LEVELS
] || LEVELS.info) as number;

const LOG_TO_FILE_ENABLED: boolean =
  typeof process.env.LOG_TO_FILE === 'string' &&
  process.env.LOG_TO_FILE.toLowerCase() === 'true';

const logFilePath: string = path.resolve(process.cwd(), 'app.log');

export function setLevel(levelName: string): void {
  const lvl = LEVELS[(levelName || '').toLowerCase()];
  if (lvl) CURRENT_LEVEL = lvl;
}

function shouldLog(level: number): boolean {
  return level >= CURRENT_LEVEL;
}

function logToFileIfEnabled(level: string, msg: string): void {
  if (!LOG_TO_FILE_ENABLED) return;
  logToFile(msg, level);
}

function emit(
  levelName: string,
  colorFn: (str: string) => string,
  msg: string,
  consoleFn: (msg: string, ...args: any[]) => void = console.log
): void {
  const numeric = LEVELS[levelName];
  if (numeric && !shouldLog(numeric)) return;
  consoleFn(colorFn(`[${levelName.toUpperCase()}]`), msg);
  logToFileIfEnabled(levelName.toUpperCase(), msg);
}

export function info(msg: string): void {
  emit('info', chalk.blue, msg);
}

export function warn(msg: string): void {
  emit('warn', chalk.yellow, msg);
}

export function error(msg: string): void {
  emit('error', chalk.red, msg, console.error);
}

export function debug(msg: string): void {
  emit('debug', chalk.magenta, msg);
}

export function help(msg: string): void {
  emit('help', chalk.green, msg);
}

function getTime(): string {
  const now = new Date();
  return now.toISOString();
}

export function plain(msg: string): void {
  const output = `[${getTime()}] ${msg}`;
  console.log(output);
  logToFileIfEnabled('PLAIN', output);
}

export function logToFile(msg: string, level: string = 'INFO'): void {
  const time = new Date().toISOString();
  const logMsg = `[${time}] [${level}] ${msg}\n`;
  fs.appendFile(logFilePath, logMsg, (err: NodeJS.ErrnoException | null) => {
    if (err) {
      console.error('Failed to write log to file:', err);
    }
  });
}
