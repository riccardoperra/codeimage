import * as sinon from 'sinon';
import {assert, test} from 'vitest';
import {HandlerBuilder} from '../../../src/common/domainFunctions/builder.js';

test('create handler', async () => {
  const fn = sinon.fake();

  const handler = HandlerBuilder.withDependencies<string>()
    .withName('name')
    // oxlint-disable-next-line typescript/no-explicit-any
    .withImplementation(deps => (arg: any) => fn(arg, deps))
    .build();

  // oxlint-disable-next-line typescript/no-explicit-any
  handler('test-deps', {} as any)(1);

  assert(fn.calledWith(1, 'test-deps'));
});
