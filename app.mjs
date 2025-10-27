import fs from 'node:fs/promises';
import readline from 'readline';
import * as commands from './commands/index.mjs';
import * as utils from './utils/index.mjs';
import { info, error as logError, warn } from './utils/logger.mjs';
import { formatError } from './utils/format.mjs';

const CONFIG_PATH = new URL('./config/config.json', import.meta.url);
const configRaw = await fs.readFile(CONFIG_PATH, 'utf-8');
const config = JSON.parse(configRaw);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'fm> ',
});

info('File manager started. Type help for assistance.');
rl.prompt();

function tokenize(input) {
  const tokens = [];
  let current = '';
  let inQuotes = false;
  let quote = '';
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inQuotes) {
      if (ch === '\\' && i + 1 < input.length) {
        // escape next character inside quotes
        current += input[i + 1];
        i++;
      } else if (ch === quote) {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inQuotes = true;
        quote = ch;
      } else if (/\s/.test(ch)) {
        if (current) {
          tokens.push(current);
          current = '';
        }
      } else {
        current += ch;
      }
    }
  }
  if (current) tokens.push(current);
  return tokens;
}

rl.on('line', async (line) => {
  const [cmd, ...args] = tokenize(line.trim());
  if (typeof commands[cmd] === 'function') {
    try {
      await commands[cmd](...args, { rl, config, utils });
    } catch (err) {
      logError(formatError(`Command execution error: ${err.message}`));
    }
  } else if (cmd) {
    warn(`Unknown command: ${cmd}. Type "help" to see available commands.`);
  }
  rl.prompt();
});

rl.on('close', () => {
  info('Session ended.');
  process.exit(0);
});
