import type readline from 'readline';

export type TokenType = 'argument' | 'flag' | 'option';

export type Token = {
  type: TokenType;
  value: string;
  quoted: boolean;
  key?: string;
  val?: string;
};

export type CommandConfig = {
  type: string;
  description: string;
};

export type Config = Record<string, CommandConfig>;

export type CommandContext = {
  rl: readline.Interface;
  config: Config;
  utils: any;
  setInQuestion: (value: boolean) => void;
};

export type FSOperationResult = {
  success: boolean;
  error?: Error;
};

export type CommandHandler = (...args: any[]) => Promise<void> | void;

export type CommandRegistry = Record<string, CommandHandler>;
