import type {AgentTool} from './tools';

/** The WebMCP surface this page uses (W3C Web Machine Learning CG draft). */
interface ModelContext {
  registerTool(
    tool: {
      name: string;
      title?: string;
      description: string;
      inputSchema?: object;
      annotations?: {readOnlyHint?: boolean; untrustedContentHint?: boolean};
      execute: (input: unknown) => Promise<unknown>;
    },
    options?: {signal?: AbortSignal},
  ): Promise<void> | void;
  /** Older Chrome previews unregister by name instead of by signal. */
  unregisterTool?(name: string): void;
}

function modelContext(): ModelContext | undefined {
  const holder = (host: object) =>
    (host as {modelContext?: ModelContext}).modelContext;
  const context = holder(document) ?? holder(navigator);
  return typeof context?.registerTool === 'function' ? context : undefined;
}

/**
 * Registers the tools with the browser's WebMCP agent, when there is one.
 * A tool that fails to register unregisters the ones before it. Returns the
 * cleanup that unregisters them all.
 */
export function registerWebMcpTools(tools: readonly AgentTool[]): () => void {
  const context = modelContext();
  if (!context) return () => {};
  const controller = new AbortController();
  const registered: string[] = [];
  const unregister = () => {
    controller.abort();
    for (const name of registered.splice(0))
      context.unregisterTool?.call(context, name);
  };
  void (async () => {
    try {
      for (const tool of tools) {
        const {name, title, description, inputSchema, annotations, execute} =
          tool;
        await context.registerTool(
          {name, title, description, inputSchema, annotations, execute},
          {signal: controller.signal},
        );
        if (controller.signal.aborted) {
          context.unregisterTool?.call(context, name);
          return;
        }
        registered.push(name);
      }
    } catch (error) {
      unregister();
      console.error('CodeImage could not register its WebMCP tools.', error);
    }
  })();
  return unregister;
}

/**
 * Offers the tools to Chrome DevTools MCP, which asks the page for them with a
 * `devtoolstooldiscovery` event when started with
 * `--categoryExperimentalThirdParty=true`. Returns the cleanup.
 */
export function installDevtoolsTools(
  tools: readonly AgentTool[],
  target: EventTarget = window,
): () => void {
  const group = {
    name: 'CodeImage',
    description:
      'Drive the CodeImage editor: read its state, add and select tabs, set the code and language, apply a theme, change frame and window settings, and export the image.',
    tools: tools.map(({name, description, inputSchema, execute}) => ({
      name,
      description,
      inputSchema,
      execute,
    })),
  };
  const discover = (event: Event) => {
    const respondWith = (event as {respondWith?: unknown}).respondWith;
    if (typeof respondWith === 'function') respondWith.call(event, group);
  };
  target.addEventListener('devtoolstooldiscovery', discover);
  return () => target.removeEventListener('devtoolstooldiscovery', discover);
}
