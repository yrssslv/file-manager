import type readline from 'readline';
import type { PluginContext, SafeFsOperations, PluginLogger } from './types.mjs';
import { SafeFs } from './safe-fs.mjs';
import { PluginEventBus } from './event-bus.mjs';
import { info, warn, error } from '../utils/logger.mjs';
import chalk from 'chalk';

export class PluginContextFactory {
  private eventBus: PluginEventBus;
  private safeFs: SafeFsOperations;
  private pluginStates = new Map<string, Map<string, unknown>>();
  private pluginConfigs = new Map<string, Record<string, unknown>>();

  constructor(
    private rl: readline.Interface,
    private appConfig: Readonly<Record<string, unknown>>,
    private setInQuestionCallback: (value: boolean) => void
  ) {
    this.eventBus = new PluginEventBus();
    this.safeFs = new SafeFs();
  }

  createContext(pluginName: string): PluginContext {
    if (!this.pluginStates.has(pluginName)) {
      this.pluginStates.set(pluginName, new Map<string, unknown>());
    }

    const pluginState = this.pluginStates.get(pluginName)!;
    const pluginConfig = this.pluginConfigs.get(pluginName) || {};
    const logger: PluginLogger = this.createLogger(pluginName);

    return {
      fs: this.safeFs,
      logger,
      config: this.appConfig,
      readline: this.rl,

      emitEvent: (eventName: string, data?: unknown) => {
        this.eventBus.emit(eventName, data, pluginName);
      },

      onEvent: (eventName: string, handler: (data: unknown) => void | Promise<void>) => {
        this.eventBus.on(eventName, handler);
      },

      getState: <T = unknown,>(key: string): T | undefined => {
        return pluginState.get(key) as T | undefined;
      },

      setState: <T = unknown,>(key: string, value: T): void => {
        pluginState.set(key, value);
      },

      getPluginConfig: <T = Record<string, unknown>,>(): T => {
        return pluginConfig as T;
      },

      setInQuestion: (value: boolean) => {
        this.setInQuestionCallback(value);
      },
    };
  }

  private createLogger(pluginName: string): PluginLogger {
    const prefix = chalk.dim(`[${pluginName}]`);

    return {
      info: (message: string) => {
        info(`${prefix} ${message}`);
      },
      warn: (message: string) => {
        warn(`${prefix} ${message}`);
      },
      error: (message: string) => {
        error(`${prefix} ${message}`);
      },
      success: (message: string) => {
        console.log(`${prefix} ${chalk.green(message)}`);
      },
    };
  }

  setPluginConfig(pluginName: string, config: Record<string, unknown>): void {
    this.pluginConfigs.set(pluginName, config);
  }

  clearPluginState(pluginName: string): void {
    this.pluginStates.delete(pluginName);
  }

  getEventBus(): PluginEventBus {
    return this.eventBus;
  }
}
