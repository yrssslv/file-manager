import type { Plugin, PluginValidationResult } from './types.mjs';

export class PluginValidator {
  validate(plugin: unknown): PluginValidationResult {
    const errors: string[] = [];

    if (!plugin || typeof plugin !== 'object') {
      return { valid: false, errors: ['Plugin must be an object'] };
    }

    const p = plugin as Record<string, unknown>;

    if (!p.name || typeof p.name !== 'string') {
      errors.push('Plugin must have a name (string)');
    } else if (!/^[a-z0-9-]+$/.test(p.name)) {
      errors.push(
        'Plugin name must contain only lowercase letters, numbers, and hyphens'
      );
    }

    if (!p.version || typeof p.version !== 'string') {
      errors.push('Plugin must have a version (string)');
    } else if (!/^\d+\.\d+\.\d+/.test(p.version)) {
      errors.push('Plugin version must follow semantic versioning (e.g., 1.0.0)');
    }

    if (!p.type || typeof p.type !== 'string') {
      errors.push('Plugin must have a type (string)');
    } else {
      const validTypes = ['meta', 'navigation', 'directory', 'file', 'other'];
      if (!validTypes.includes(p.type as string)) {
        errors.push(`Plugin type must be one of: ${validTypes.join(', ')}`);
      }
    }

    if (!p.description || typeof p.description !== 'string') {
      errors.push('Plugin must have a description (string)');
    }

    if (!p.execute || typeof p.execute !== 'function') {
      errors.push('Plugin must have an execute function');
    }

    if (p.onLoad && typeof p.onLoad !== 'function') {
      errors.push('Plugin onLoad must be a function');
    }

    if (p.onUnload && typeof p.onUnload !== 'function') {
      errors.push('Plugin onUnload must be a function');
    }

    if (p.dependencies) {
      if (!Array.isArray(p.dependencies)) {
        errors.push('Plugin dependencies must be an array');
      } else {
        for (const dep of p.dependencies) {
          if (typeof dep !== 'string') {
            errors.push('All dependencies must be strings');
            break;
          }
        }
      }
    }

    if (p.schema && typeof p.schema !== 'object') {
      errors.push('Plugin schema must be an object');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  isValidPlugin(plugin: unknown): plugin is Plugin {
    return this.validate(plugin).valid;
  }

  assertValid(plugin: unknown): asserts plugin is Plugin {
    const result = this.validate(plugin);
    if (!result.valid) {
      throw new Error(`Invalid plugin: ${result.errors.join(', ')}`);
    }
  }
}
