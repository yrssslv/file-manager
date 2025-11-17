import fs from 'node:fs/promises';
import readline from 'readline';
import * as commands from './commands/index.mjs';
import * as utils from './utils/index.mjs';
import { info, error as logError, warn } from './utils/logger.mjs';
import { formatError } from './utils/format.mjs';
import { tokenize } from './utils/tokenizer.mjs';

type Config = Record<string, { type: string; description: string }>;

type CommandContext = {
  rl: readline.Interface;
  config: Config;
  utils: typeof utils;
  setInQuestion: (value: boolean) => void;
};

const CONFIG_PATH: URL = new URL('./config/config.json', import.meta.url);
const configRaw: string = await fs.readFile(CONFIG_PATH, 'utf-8');
const config: Config = JSON.parse(configRaw);

const rl: readline.Interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'fm> ',
});

let isInQuestion = false;

info('File manager started. Type help for assistance.');
rl.prompt();

rl.on('line', async (line: string) => {
  if (isInQuestion) return;
  const tokens = tokenize(line.trim());
  const argTokens = tokens.filter((t) => t.type === 'argument');

  if (argTokens.length === 0) {
    rl.prompt();
    return;
  }

  const cmd = argTokens[0]!.value;
  const args = tokens.slice(1).map((t) => t.value);

  if (cmd && typeof (commands as any)[cmd] === 'function') {
    try {
      await ((commands as any)[cmd] as (...args: any[]) => Promise<void>)(...args, {
        rl,
        config,
        utils,
        setInQuestion: (value: boolean) => {
          isInQuestion = value;
        },
      } as CommandContext);
    } catch (err: unknown) {
      logError(
        formatError(
          `Command execution error: ${err instanceof Error ? err.message : String(err)}`
        )
      );
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
