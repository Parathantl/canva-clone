import type { Plugin, ShortcutRegistration, ExportHandlerRegistration, ToolbarRegistration, PanelRegistration, ElementTypeRegistration } from '../types/plugin';
import { EventBus } from '../events/EventBus';

// Single Responsibility: Manages plugin lifecycle and dependency resolution
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private eventBus: EventBus;
  private shortcutRegistry: ShortcutRegistration[] = [];
  private exportHandlerRegistry: Map<string, ExportHandlerRegistration> = new Map();
  private toolbarRegistry: ToolbarRegistration[] = [];
  private panelRegistry: PanelRegistration[] = [];
  private elementTypeRegistry: Map<string, ElementTypeRegistration> = new Map();

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin "${plugin.name}" is already registered.`);
    }

    // Resolve dependencies
    this.resolveDependencies(plugin);

    // Register plugin
    this.plugins.set(plugin.name, plugin);

    // Register element types
    if (plugin.elementTypes) {
      for (const elementType of plugin.elementTypes) {
        this.elementTypeRegistry.set(elementType.type, elementType);
      }
    }

    // Register toolbar items
    if (plugin.toolbar) {
      this.toolbarRegistry.push(...plugin.toolbar);
      this.toolbarRegistry.sort((a, b) => a.order - b.order);
    }

    // Register shortcuts
    if (plugin.shortcuts) {
      this.shortcutRegistry.push(...plugin.shortcuts);
    }

    // Register export handlers
    if (plugin.exportHandlers) {
      for (const handler of plugin.exportHandlers) {
        this.exportHandlerRegistry.set(handler.format, handler);
      }
    }

    // Register panels
    if (plugin.panels) {
      this.panelRegistry.push(...plugin.panels);
      this.panelRegistry.sort((a, b) => a.order - b.order);
    }

    // Call lifecycle hook
    plugin.hooks?.onInit?.();

    this.eventBus.emit('plugin:register', { name: plugin.name });
  }

  unregister(pluginName: string): void {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) return;

    // Check if other plugins depend on this one
    for (const [name, p] of this.plugins) {
      if (p.dependencies?.includes(pluginName)) {
        throw new Error(
          `Cannot unregister "${pluginName}": plugin "${name}" depends on it.`
        );
      }
    }

    // Clean up registrations
    if (plugin.elementTypes) {
      for (const et of plugin.elementTypes) {
        this.elementTypeRegistry.delete(et.type);
      }
    }
    if (plugin.toolbar) {
      const ids = new Set(plugin.toolbar.map((t) => t.id));
      this.toolbarRegistry = this.toolbarRegistry.filter((t) => !ids.has(t.id));
    }
    if (plugin.shortcuts) {
      const ids = new Set(plugin.shortcuts.map((s) => s.id));
      this.shortcutRegistry = this.shortcutRegistry.filter((s) => !ids.has(s.id));
    }
    if (plugin.exportHandlers) {
      for (const handler of plugin.exportHandlers) {
        this.exportHandlerRegistry.delete(handler.format);
      }
    }
    if (plugin.panels) {
      const ids = new Set(plugin.panels.map((p) => p.id));
      this.panelRegistry = this.panelRegistry.filter((p) => !ids.has(p.id));
    }

    plugin.hooks?.onDestroy?.();
    this.plugins.delete(pluginName);
    this.eventBus.emit('plugin:unregister', { name: pluginName });
  }

  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getShortcuts(): ShortcutRegistration[] {
    return this.shortcutRegistry;
  }

  getExportHandler(format: string): ExportHandlerRegistration | undefined {
    return this.exportHandlerRegistry.get(format);
  }

  getToolbarItems(): ToolbarRegistration[] {
    return this.toolbarRegistry;
  }

  getPanels(position?: string): PanelRegistration[] {
    if (position) {
      return this.panelRegistry.filter((p) => p.position === position);
    }
    return this.panelRegistry;
  }

  getElementType(type: string): ElementTypeRegistration | undefined {
    return this.elementTypeRegistry.get(type);
  }

  getAllElementTypes(): ElementTypeRegistration[] {
    return Array.from(this.elementTypeRegistry.values());
  }

  private resolveDependencies(plugin: Plugin): void {
    if (!plugin.dependencies?.length) return;

    const visited = new Set<string>();
    const resolving = new Set<string>();

    const resolve = (name: string) => {
      if (visited.has(name)) return;
      if (resolving.has(name)) {
        throw new Error(`Circular dependency detected: ${Array.from(resolving).join(' -> ')} -> ${name}`);
      }

      resolving.add(name);
      const dep = this.plugins.get(name);
      if (!dep) {
        throw new Error(`Plugin "${plugin.name}" requires "${name}", but it is not registered.`);
      }

      if (dep.dependencies) {
        for (const subDep of dep.dependencies) {
          resolve(subDep);
        }
      }

      resolving.delete(name);
      visited.add(name);
    };

    for (const dep of plugin.dependencies) {
      resolve(dep);
    }
  }
}
