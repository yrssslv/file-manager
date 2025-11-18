import type { Plugin, PluginMetadata, PluginLoadOptions } from './types.mjs';
import { PluginLoader } from './loader.mjs';
import { PluginSandbox } from './sandbox.mjs';
import { PluginContextFactory } from './context-factory.mjs';
import { DependencyResolver } from './dependency-resolver.mjs';

export class PluginRegistry {
  private plugins = new Map<string, Plugin>();
  private metadata = new Map<string, PluginMetadata>();
  private loader: PluginLoader;
  private sandbox: PluginSandbox;
  private contextFactory: PluginContextFactory;
  private dependencyResolver: DependencyResolver;

  constructor(contextFactory: PluginContextFactory) {
    this.loader = new PluginLoader();
    this.sandbox = new PluginSandbox();
    this.contextFactory = contextFactory;
    this.dependencyResolver = new DependencyResolver();
  }

  async register(plugin: Plugin, options?: PluginLoadOptions): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered`);
    }

    if (plugin.dependencies && !options?.skipDependencyCheck) {
      const missing = plugin.dependencies.filter((dep) => !this.plugins.has(dep));
      if (missing.length > 0) {
        throw new Error(
          `Plugin "${plugin.name}" has missing dependencies: ${missing.join(', ')}`
        );
      }
    }

    this.plugins.set(plugin.name, plugin);

    const meta: PluginMetadata = {
      name: plugin.name,
      version: plugin.version,
      type: plugin.type,
      description: plugin.description,
      ...(plugin.author && { author: plugin.author }),
      dependencies: plugin.dependencies || [],
      loaded: true,
      enabled: true,
      loadedAt: new Date(),
    };

    this.metadata.set(plugin.name, meta);

    if (plugin.onLoad) {
      const context = this.contextFactory.createContext(plugin.name);
      try {
        await plugin.onLoad(context);
      } catch (err) {
        this.plugins.delete(plugin.name);
        this.metadata.delete(plugin.name);
        throw new Error(
          `Plugin "${plugin.name}" onLoad failed: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
  }

  async unregister(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin "${name}" is not registered`);
    }

    const dependents = Array.from(this.plugins.values()).filter((p) =>
      p.dependencies?.includes(name)
    );

    if (dependents.length > 0) {
      throw new Error(
        `Cannot unregister plugin "${name}": required by ${dependents.map((p) => p.name).join(', ')}`
      );
    }

    if (plugin.onUnload) {
      try {
        await plugin.onUnload();
      } catch (err) {
        console.error(
          `Plugin "${name}" onUnload error:`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }

    this.plugins.delete(name);
    this.metadata.delete(name);
    this.contextFactory.clearPluginState(name);
  }

  async loadFromFile(filePath: string, options?: PluginLoadOptions): Promise<void> {
    const plugin = await this.loader.loadFromFile(filePath, options);
    await this.register(plugin, options);
  }

  async loadFromDirectory(dirPath: string): Promise<void> {
    const plugins = await this.loader.loadFromDirectory(dirPath);

    const errors = this.dependencyResolver.validateDependencies(plugins);
    if (errors.length > 0) {
      throw new Error(`Dependency validation failed:\n${errors.join('\n')}`);
    }

    const sorted = this.dependencyResolver.resolveDependencies(plugins);

    for (const plugin of sorted) {
      await this.register(plugin, { skipDependencyCheck: true });
    }
  }

  async executeCommand(name: string, args: string[]): Promise<void> {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Unknown command: ${name}`);
    }

    const meta = this.metadata.get(name);
    if (!meta?.enabled) {
      throw new Error(`Plugin "${name}" is disabled`);
    }

    const context = this.contextFactory.createContext(plugin.name);
    await this.sandbox.execute(plugin, args, context);
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getMetadata(name: string): PluginMetadata | undefined {
    return this.metadata.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getAllMetadata(): PluginMetadata[] {
    return Array.from(this.metadata.values());
  }

  hasPlugin(name: string): boolean {
    return this.plugins.has(name);
  }

  enablePlugin(name: string): void {
    const meta = this.metadata.get(name);
    if (meta) {
      meta.enabled = true;
    }
  }

  disablePlugin(name: string): void {
    const meta = this.metadata.get(name);
    if (meta) {
      meta.enabled = false;
    }
  }

  getPluginsByType(type: string): Plugin[] {
    return Array.from(this.plugins.values()).filter((p) => p.type === type);
  }

  clear(): void {
    this.plugins.clear();
    this.metadata.clear();
  }
}
