import fs from 'fs/promises';
import readline from 'readline';
import * as commands from './commands/index.mjs';
import * as utils from './utils/index.mjs';

const configRaw = await fs.readFile('./config/config.json', 'utf-8');
const config = JSON.parse(configRaw);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'fm> ',
});

console.log('File manager started. Type help for assistance.');
rl.prompt();

rl.on('line', async (line) => {
  const [cmd, ...args] = line.trim().split(/\s+/);
  if (typeof commands[cmd] === 'function') {
    try {
      await commands[cmd](...args, { rl, config, utils });
    } catch (err) {
      console.error('Command execution error:', err.message);
    }
  } else if (cmd) {
    console.log('Unknown command:', cmd);
  }
  rl.prompt();
});

rl.on('close', () => {
  console.log('Session ended.');
  process.exit(0);
});
