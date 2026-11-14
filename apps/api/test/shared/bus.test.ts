import Fastify from 'fastify';
import {expect, expectTypeOf, test} from 'vitest';
import busPlugin from '../../src/plugins/bus.js';
import {
  createBus,
  defineCommand,
  defineQuery,
  defineHandler,
  type Middleware,
} from '../../src/shared/bus.js';

const length = defineQuery<{text: string}, number>('test.length');
const greet = defineCommand<{name: string}, string>('test.greet');

test('execute returns the typed handler result', async () => {
  const bus = createBus();
  bus.register(length, async ({text}) => text.length);
  const result = bus.execute(length({text: 'hello'}));
  expectTypeOf(result).toEqualTypeOf<Promise<number>>();
  expect(await result).toBe(5);
});

test('duplicate registration throws instead of overwriting', () => {
  const bus = createBus();
  bus.register(length, async () => 1);
  expect(() => bus.register(length, async () => 2)).toThrow(
    'already registered: test.length',
  );
});

test('unregistered execution throws', async () => {
  await expect(createBus().execute(length({text: ''}))).rejects.toThrow(
    'not registered: test.length',
  );
});

test('middlewares wrap the handler in declaration order and compose results', async () => {
  const calls: string[] = [];
  const outer: Middleware = async (action, next) => {
    calls.push(`outer before ${action.name}`);
    const value = await next();
    calls.push('outer after');
    return `[${value}]`;
  };
  const inner: Middleware = async (_, next) => {
    calls.push('inner before');
    const value = await next();
    calls.push('inner after');
    return `${value}!`;
  };
  const bus = createBus({middlewares: [outer, inner]});
  bus.register(greet, async ({name}) => {
    calls.push('handler');
    return name;
  });
  expect(await bus.execute(greet({name: 'hello'}))).toBe('[hello!]');
  expect(calls).toEqual([
    'outer before test.greet',
    'inner before',
    'handler',
    'inner after',
    'outer after',
  ]);
});

test('handler and middleware errors propagate through the chain unchanged', async () => {
  const error = new Error('failed');
  const observed: unknown[] = [];
  const middleware: Middleware = async (_, next) => {
    try {
      return await next();
    } catch (err) {
      observed.push(err);
      throw err;
    }
  };
  const bus = createBus({middlewares: [middleware, middleware]});
  bus.register(length, async () => {
    throw error;
  });
  await expect(bus.execute(length({text: ''}))).rejects.toBe(error);
  expect(observed).toEqual([error, error]);
  const blocked = createBus({
    middlewares: [
      async () => {
        throw error;
      },
    ],
  });
  blocked.register(length, async () => 1);
  await expect(blocked.execute(length({text: ''}))).rejects.toBe(error);
});

test('defineHandler exposes the factory and registers on the selected bus', async t => {
  const handler = defineHandler(
    greet,
    ({prefix}: {prefix: string}) =>
      async ({name}) =>
        `${prefix} ${name}`,
  );
  expect(await handler.factory({prefix: 'Hi'})({name: 'Ada'})).toBe('Hi Ada');
  const app = Fastify();
  t.onTestFinished(() => app.close());
  await app.register(busPlugin);
  await app.register(handler, {prefix: 'Hello'});
  await app.ready();
  expect(await app.commandBus.execute(greet({name: 'Ada'}))).toBe('Hello Ada');
  await expect(app.queryBus.execute(greet({name: 'Ada'}))).rejects.toThrow(
    'not registered',
  );
});
