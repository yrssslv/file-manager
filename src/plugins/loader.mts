import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { Plugin, PluginLoadOptions } from './types.mjs';
import { PluginValidator } from './validator.mjs';

export class PluginLoader {
  private validator = new PluginValidator();
  private loadedModules = new Map<string, Plugin>();

  async loadFromFile(filePath: string, _options?: PluginLoadOptions): Promise<Plugin> {
    const absolutePath = path.resolve(filePath);
    const fileUrl = pathToFileURL(absolutePath).href;

    try {
      const module = await import(fileUrl);
      const plugin = module.default || module;

      const validationResult = this.validator.validate(plugin);
      if (!validationResult.valid) {
        throw new Error(`Invalid plugin: ${validationResult.errors.join(', ')}`);
      }

      this.loadedModules.set((plugin as Plugin).name, plugin as Plugin);
      return plugin as Plugin;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Failed to load plugin from ${filePath}: ${err.message}`);
      }
      throw err;
    }
  }

  async loadFromDirectory(dirPath: string): Promise<Plugin[]> {
    const fs = await import('node:fs/promises');
    const absolutePath = path.resolve(dirPath);

    try {
      const entries = await fs.readdir(absolutePath, { withFileTypes: true });
      const plugins: Plugin[] = [];

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith('.plugin.mjs')) {
          const pluginPath = path.join(absolutePath, entry.name);
          try {
            const plugin = await this.loadFromFile(pluginPath);
            plugins.push(plugin);
          } catch (err) {
            console.error(`Failed to load plugin ${entry.name}:`, err);
          }
        }
      }

      return plugins;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Failed to load plugins from ${dirPath}: ${err.message}`);
      }
      throw err;
    }
  }

  async loadFromNpm(packageName: string): Promise<Plugin> {
    if (!packageName.startsWith('fm-plugin-')) {
      throw new Error(
        `Invalid plugin package name: ${packageName}. Must start with "fm-plugin-"`
      );
    }

    try {
      const module = await import(packageName);
      const plugin = module.default || module;

      const validationResult = this.validator.validate(plugin);
      if (!validationResult.valid) {
        throw new Error(`Invalid plugin: ${validationResult.errors.join(', ')}`);
      }

      this.loadedModules.set((plugin as Plugin).name, plugin as Plugin);
      return plugin as Plugin;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(`Failed to load plugin from npm: ${packageName}: ${err.message}`);
      }
      throw err;
    }
  }

  getLoadedPlugin(name: string): Plugin | undefined {
    return this.loadedModules.get(name);
  }

  getAllLoadedPlugins(): Plugin[] {
    return Array.from(this.loadedModules.values());
  }

  unloadPlugin(name: string): boolean {
    return this.loadedModules.delete(name);
  }

  clearCache(): void {
    this.loadedModules.clear();
  }
}
