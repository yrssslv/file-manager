import type { Plugin, PluginContext } from './types.mjs';

export class PluginSandbox {
  private defaultTimeout = 30_000;

  async execute(
    plugin: Plugin,
    args: string[],
    context: PluginContext,
    timeout?: number
  ): Promise<void> {
    const timeoutMs = timeout ?? this.defaultTimeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const executionPromise = plugin.execute(args, context);

      const timeoutPromise = new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error(`Plugin "${plugin.name}" execution timeout (${timeoutMs}ms)`));
        });
      });

      await Promise.race([executionPromise, timeoutPromise]);
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Plugin "${plugin.name}" execution failed: ${err.message}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async executeWithRetry(
    plugin: Plugin,
    args: string[],
    context: PluginContext,
    maxRetries = 3
  ): Promise<void> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await this.execute(plugin, args, context);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        if (attempt < maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Plugin "${plugin.name}" failed after ${maxRetries + 1} attempts: ${lastError?.message}`
    );
  }

  setDefaultTimeout(timeoutMs: number): void {
    if (timeoutMs <= 0) {
      throw new Error('Timeout must be positive');
    }
    this.defaultTimeout = timeoutMs;
  }

  getDefaultTimeout(): number {
    return this.defaultTimeout;
  }
}
