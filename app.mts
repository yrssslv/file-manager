import fs from 'node:fs/promises';
import readline from 'readline';
import * as commands from './commands/index.mjs';
import * as utils from './utils/index.mjs';
import { info, error as logError, warn } from './utils/logger.mjs';
import { formatError } from './utils/format.mjs';

type Config = Record<string, { type: string; description: string }>;

type CommandContext = {
  rl: readline.Interface;
  config: Config;
  utils: typeof utils;
  setInQuestion: (value: boolean) => void;
};

type TokenType = 'argument' | 'flag' | 'option';

type Token = {
  type: TokenType;
  value: string;
  quoted: boolean;
  key?: string;
  val?: string;
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

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';
  let escapeNext = false;
  let wasQuoted = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input.charAt(i);

    if (escapeNext) {
      current += ch;
      escapeNext = false;
      continue;
    }

    if (ch === '\\') {
      escapeNext = true;
      continue;
    }

    if (inQuotes) {
      if (ch === quoteChar) {
        inQuotes = false;
        quoteChar = '';
        wasQuoted = true;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"' || ch === "'") {
        inQuotes = true;
        quoteChar = ch;
      } else if (/\s/.test(ch)) {
        if (current || wasQuoted) {
          tokens.push(parseToken(current, wasQuoted));
          current = '';
          wasQuoted = false;
        }
      } else {
        current += ch;
      }
    }
  }

  if (current || wasQuoted) {
    tokens.push(parseToken(current, inQuotes || wasQuoted));
  }

  return tokens;
}

function parseToken(value: string, quoted: boolean): Token {
  if (value.startsWith('--')) {
    const eqIndex = value.indexOf('=');
    if (eqIndex !== -1) {
      const key = value.slice(2, eqIndex);
      const val = value.slice(eqIndex + 1);
      return { type: 'option', value, quoted, key, val };
    } else {
      return { type: 'flag', value, quoted };
    }
  } else if (value.startsWith('-') && value.length > 1 && !quoted) {
    return { type: 'flag', value, quoted };
  } else {
    return { type: 'argument', value, quoted };
  }
}

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
