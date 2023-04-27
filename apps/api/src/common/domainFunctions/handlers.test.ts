import {DomainHandlerMap, ResolvedDomainHandlerMap} from '@api/domain';
import {expect, test, vi} from 'vitest';
import {$HANDLER, createModuleHandlers, registerHandlers} from './handlers';
import {HandlerRegistry} from './registry';

test('create handler', () => {
  type Deps = {
    p1: string;
    p2: number;
  };

  const createHandler = createModuleHandlers<Deps>();

  const handler = createHandler('handler1', deps => {
    return (p1: symbol, p2: string) => {
      return {
        dep1: deps.p1,
        dep2: deps.p2,
        p1,
        p2,
        p3: 1,
      } as const;
    };
  });

  expect((handler as any)[$HANDLER].name).toBe('handler1');
});

test('resolve handlers', () => {
  const registry = new HandlerRegistry();

  type Deps = {
    p1: string;
    p2: number;
  };

  const createHandler = createModuleHandlers<Deps>();

  const handler = createHandler('handler1', deps => {
    return (p1: symbol, p2: string) => {
      return {
        dep1: deps.p1,
        dep2: deps.p2,
        p1,
        p2,
        p3: 1,
      } as const;
    };
  });

  const handler2 = createHandler('handler2', () => {
    return () => {
      return {
        p3: 1,
      } as const;
    };
  });

  const resolvedHandlers = registerHandlers(
    [handler, handler2],
    {
      p1: '',
      p2: 1,
    },
    registry,
  );

  expect(resolvedHandlers).toHaveProperty('handler1');
  expect(resolvedHandlers).toHaveProperty('handler2');
  expect(Object.keys(registry.handlers)).toEqual(['handler1', 'handler2']);
});

test('handler events are evaluated only after call', () => {
  const mockFn = vi.fn<[Deps, ResolvedDomainHandlerMap<DomainHandlerMap>]>();
  const mockFn2 = vi.fn();
  const registry = new HandlerRegistry();

  type Deps = {
    p1: string;
    p2: number;
  };

  const createHandler = createModuleHandlers<Deps>();

  const handler1 = createHandler('handler1', (deps, {handlers}) => {
    mockFn(deps, handlers);
    return (p1: symbol, p2: string) => {
      (handlers as any).handler2(p1, p2);
      return {
        dep1: deps.p1,
        dep2: deps.p2,
        p1,
        p2,
        p3: 1,
      } as const;
    };
  });

  const handler2 = createHandler('handler2', () => {
    return (...params: any) => {
      mockFn2(...params);
      return {
        p3: 1,
      } as const;
    };
  });

  const deps = {
    p1: '',
    p2: 1,
  };

  const resolvedHandlers = registerHandlers(
    [handler1, handler2],
    deps,
    registry,
  );

  const givenParams = {
    p1: Symbol('test'),
    p2: '1',
  };

  resolvedHandlers.handler1(givenParams.p1, givenParams.p2);

  const mockCall = mockFn.mock.calls[0];
  expect(mockCall[0]).toEqual(deps);
  expect(mockCall[1]).toHaveProperty('handler1');
  expect(mockCall[1]).toHaveProperty('handler2');

  expect(mockFn2).toHaveBeenCalledWith(givenParams.p1, givenParams.p2);
});
