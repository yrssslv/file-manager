import type { Plugin } from './types.mjs';

export class DependencyResolver {
  resolveDependencies(plugins: Plugin[]): Plugin[] {
    const pluginMap = new Map<string, Plugin>();
    const visited = new Set<string>();
    const visiting = new Set<string>();
    const sorted: Plugin[] = [];

    for (const plugin of plugins) {
      pluginMap.set(plugin.name, plugin);
    }

    const visit = (name: string, path: string[] = []): void => {
      if (visited.has(name)) {
        return;
      }

      if (visiting.has(name)) {
        const cycle = [...path, name].join(' -> ');
        throw new Error(`Circular dependency detected: ${cycle}`);
      }

      const plugin = pluginMap.get(name);
      if (!plugin) {
        throw new Error(`Missing dependency: ${name}`);
      }

      visiting.add(name);

      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          visit(dep, [...path, name]);
        }
      }

      visiting.delete(name);
      visited.add(name);
      sorted.push(plugin);
    };

    for (const plugin of plugins) {
      visit(plugin.name);
    }

    return sorted;
  }

  validateDependencies(plugins: Plugin[]): string[] {
    const errors: string[] = [];
    const pluginNames = new Set(plugins.map((p) => p.name));

    for (const plugin of plugins) {
      if (plugin.dependencies) {
        for (const dep of plugin.dependencies) {
          if (!pluginNames.has(dep)) {
            errors.push(`Plugin "${plugin.name}" requires missing dependency: ${dep}`);
          }
        }
      }
    }

    try {
      this.resolveDependencies(plugins);
    } catch (err) {
      if (err instanceof Error) {
        errors.push(err.message);
      }
    }

    return errors;
  }
}
