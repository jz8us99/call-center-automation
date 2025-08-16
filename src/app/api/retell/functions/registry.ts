import { FunctionHandler, FunctionEntry } from './types';

/**
 * Global function registry
 */
class FunctionRegistry {
  private functions: Map<string, FunctionEntry> = new Map();

  /**
   * Register a function handler
   */
  register(entry: FunctionEntry): void {
    this.functions.set(entry.name, entry);
  }

  /**
   * Get a function handler by name
   */
  getHandler(name: string): FunctionHandler | undefined {
    const entry = this.functions.get(name);
    return entry?.handler;
  }

  /**
   * Get all registered function names
   */
  getFunctionNames(): string[] {
    return Array.from(this.functions.keys());
  }

  /**
   * Check if a function is registered
   */
  hasFunction(name: string): boolean {
    return this.functions.has(name);
  }

  /**
   * Get function entry
   */
  getEntry(name: string): FunctionEntry | undefined {
    return this.functions.get(name);
  }
}

// Export singleton instance
export const functionRegistry = new FunctionRegistry();
