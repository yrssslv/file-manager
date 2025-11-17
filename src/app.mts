import fs from 'node:fs/promises';
import readline from 'readline';
import * as commands from './commands/index.mjs';
import * as utils from './utils/index.mjs';
import { info, error as logError, warn } from './utils/logger.mjs';
import { formatError } from './utils/format.mjs';
import { tokenize } from './utils/tokenizer.mjs';
import type { Config, CommandContext, CommandRegistry } from './types/index.mjs';

const CONFIG_PATH: URL = new URL('./config/config.json', import.meta.url);
const configRaw: string = await fs.readFile(CONFIG_PATH, 'utf-8');
const config: Config = JSON.parse(configRaw);

const rl: readline.Interface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'fm> ',
});

let isInQuestion = false;

function handleCommandError(commandName: string, err: unknown): void {
  const errorMessage = err instanceof Error ? err.message : String(err);
  logError(formatError(`Command '${commandName}' execution error: ${errorMessage}`));

  if (err instanceof Error && err.stack && process.env.DEBUG === 'true') {
    console.error(err.stack);
  }
}

async function executeCommand(
  cmd: string,
  args: string[],
  context: CommandContext
): Promise<void> {
  const commandRegistry = commands as CommandRegistry;
  const commandHandler = commandRegistry[cmd];

  if (typeof commandHandler !== 'function') {
    warn(`Unknown command: ${cmd}. Type "help" to see available commands.`);
    return;
  }

  try {
    await commandHandler(...args, context);
  } catch (err: unknown) {
    handleCommandError(cmd, err);
  }
}

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

  const context: CommandContext = {
    rl,
    config,
    utils,
    setInQuestion: (value: boolean) => {
      isInQuestion = value;
    },
  };

  await executeCommand(cmd, args, context);
  rl.prompt();
});

rl.on('close', () => {
  info('Session ended.');
  process.exit(0);
});

process.on('unhandledRejection', (reason: unknown) => {
  logError(
    formatError(
      'Unhandled rejection',
      reason instanceof Error ? reason : new Error(String(reason))
    )
  );
});

process.on('uncaughtException', (err: Error) => {
  logError(formatError('Uncaught exception', err));
  process.exit(1);
});
