import {expect, test, vi} from 'vitest';
import {HandlerBuilder} from '../../../src/common/domainFunctions/builder.js';

test('create handler', async () => {
  const fn = vi.fn();

  const handler = HandlerBuilder.withDependencies<string>()
    .withName('name')
    // oxlint-disable-next-line typescript/no-explicit-any
    .withImplementation(deps => (arg: any) => fn(arg, deps))
    .build();

  // oxlint-disable-next-line typescript/no-explicit-any
  handler('test-deps', {} as any)(1);

  expect(fn).toHaveBeenCalledWith(1, 'test-deps');
});
