import type readline from 'readline';

export type CommandType = 'meta' | 'navigation' | 'directory' | 'file' | 'other';

export interface ParameterSchema {
  args?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean';
    optional?: boolean;
    description?: string;
  }>;
  flags?: Array<{
    name: string;
    shorthand?: string;
    description?: string;
    type?: 'boolean' | 'string';
  }>;
}

export interface PluginContext {
  fs: SafeFsOperations;
  logger: PluginLogger;
  config: Readonly<Record<string, unknown>>;
  readline: readline.Interface;
  emitEvent: (eventName: string, data?: unknown) => void;
  onEvent: (eventName: string, handler: (data: unknown) => void | Promise<void>) => void;
  getState: <T = unknown>(key: string) => T | undefined;
  setState: <T = unknown>(key: string, value: T) => void;
  getPluginConfig: <T = Record<string, unknown>>() => T;
  setInQuestion: (value: boolean) => void;
}

export interface SafeFsOperations {
  cwd: () => string;
  chdir: (path: string) => Promise<void>;
  readDir: (path: string) => Promise<string[]>;
  readFile: (path: string, encoding?: BufferEncoding) => Promise<string>;
  writeFile: (path: string, content: string) => Promise<void>;
  unlink: (path: string) => Promise<void>;
  mkdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  rmdir: (path: string, options?: { recursive?: boolean }) => Promise<void>;
  exists: (path: string) => Promise<boolean>;
  stat: (path: string) => Promise<{
    isFile: () => boolean;
    isDirectory: () => boolean;
    size: number;
    mtime: Date;
  }>;
  copyFile: (source: string, destination: string) => Promise<void>;
  rename: (oldPath: string, newPath: string) => Promise<void>;
}

export interface PluginLogger {
  info: (message: string) => void;
  warn: (message: string) => void;
  error: (message: string) => void;
  success: (message: string) => void;
}

export type CommandHandler = (
  args: string[],
  context: PluginContext
) => Promise<void> | void;

export interface Plugin {
  name: string;
  version: string;
  type: CommandType;
  description: string;
  execute: CommandHandler;
  onLoad?: (context: PluginContext) => Promise<void> | void;
  onUnload?: () => Promise<void> | void;
  dependencies?: string[];
  schema?: ParameterSchema;
  author?: string;
  minAppVersion?: string;
  maxAppVersion?: string;
}

export interface PluginMetadata {
  name: string;
  version: string;
  type: CommandType;
  description: string;
  author?: string;
  dependencies: string[];
  loaded: boolean;
  enabled: boolean;
  loadedAt?: Date;
}

export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PluginConfig {
  enabled: boolean;
  autoload: boolean;
  config?: Record<string, unknown>;
}

export interface PluginEvent {
  name: string;
  data?: unknown;
  timestamp: Date;
  source?: string;
}

export interface PluginLoadOptions {
  skipDependencyCheck?: boolean;
  force?: boolean;
  asCore?: boolean;
}
