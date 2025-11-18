import type readline from 'readline';

// ============================================================================
// Legacy Types (для обратной совместимости)
// ============================================================================

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

/**
 * @deprecated Use PluginContext from plugins/types.mts instead
 */
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

/**
 * @deprecated Use Plugin interface from plugins/types.mts instead
 */
export type CommandHandler = (...args: any[]) => Promise<void> | void;

/**
 * @deprecated Use PluginRegistry instead
 */
export type CommandRegistry = Record<string, CommandHandler>;

// ============================================================================
// Re-export Plugin Types для удобства
// ============================================================================

export type {
  Plugin,
  PluginContext,
  PluginMetadata,
  PluginConfig,
  PluginEvent,
  PluginValidationResult,
  PluginLoadOptions,
  CommandType,
  ParameterSchema,
  SafeFsOperations,
  PluginLogger,
} from '../plugins/types.mjs';
