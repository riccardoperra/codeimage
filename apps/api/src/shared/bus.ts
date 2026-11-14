import type {FastifyPluginOptions} from 'fastify';
import fp from 'fastify-plugin';

declare const resultType: unique symbol;
type ActionKind = 'command' | 'query';

export interface Action<Payload, Result> {
  readonly kind: ActionKind;
  readonly name: string;
  readonly payload: Payload;
  readonly [resultType]?: Result;
}

export type ActionCreator<Payload, Result> = ((
  payload: Payload,
) => Action<Payload, Result>) & {
  readonly actionName: string;
  readonly kind: ActionKind;
};

const definedActions = new Map<string, ActionKind>();

function defineAction<Payload, Result>(
  kind: ActionKind,
  name: string,
): ActionCreator<Payload, Result> {
  if (definedActions.has(name))
    throw new Error(`Action already defined: ${name}`);
  definedActions.set(name, kind);
  return Object.assign(
    (payload: Payload): Action<Payload, Result> => ({kind, name, payload}),
    {actionName: name, kind},
  );
}

export const defineCommand = <Payload, Result>(name: string) =>
  defineAction<Payload, Result>('command', name);
export const defineQuery = <Payload, Result>(name: string) =>
  defineAction<Payload, Result>('query', name);

export type Middleware = (
  action: Action<unknown, unknown>,
  next: () => Promise<unknown>,
) => Promise<unknown>;

export function createBus({
  middlewares = [],
}: {middlewares?: readonly Middleware[]} = {}) {
  const handlers = new Map<string, (payload: unknown) => Promise<unknown>>();
  return {
    has(name: string): boolean {
      return handlers.has(name);
    },
    register<Payload, Result>(
      creator: ActionCreator<Payload, Result>,
      handler: (payload: Payload) => Promise<Result>,
    ) {
      if (handlers.has(creator.actionName))
        throw new Error(`Handler already registered: ${creator.actionName}`);
      handlers.set(creator.actionName, payload => handler(payload as Payload));
    },
    async execute<Payload, Result>(
      action: Action<Payload, Result>,
    ): Promise<Result> {
      const handler = handlers.get(action.name);
      if (!handler) throw new Error(`Handler not registered: ${action.name}`);
      const invoke = middlewares.reduceRight<() => Promise<unknown>>(
        (next, middleware) => () => middleware(action, next),
        () => handler(action.payload),
      );
      return (await invoke()) as Result;
    },
  };
}

export type Bus = ReturnType<typeof createBus>;

export function unregisteredActions(buses: {
  readonly command: Bus;
  readonly query: Bus;
}): string[] {
  return [...definedActions]
    .filter(([name, kind]) => !buses[kind].has(name))
    .map(([name]) => name);
}

export function defineHandler<
  Payload,
  Result,
  Deps extends FastifyPluginOptions,
>(
  creator: ActionCreator<Payload, Result>,
  factory: (deps: Deps) => (payload: Payload) => Promise<Result>,
) {
  const plugin = fp<Deps>(
    async (fastify, deps) => {
      const bus =
        creator.kind === 'command' ? fastify.commandBus : fastify.queryBus;
      bus.register(creator, factory(deps));
    },
    {name: creator.actionName, dependencies: ['bus']},
  );
  return Object.assign(plugin, {factory});
}
