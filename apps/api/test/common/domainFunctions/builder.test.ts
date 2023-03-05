import * as sinon from 'sinon';
import {test} from 'tap';
import {HandlerBuilder} from '../../../src/common/domainFunctions/builder';

test('create handler', async t => {
  const fn = sinon.fake();

  const handler = HandlerBuilder.withDependencies<string>()
    .withName('name')
    .withImplementation(deps => (arg: any) => fn(arg, deps))
    .build();

  handler('test-deps', {} as any)(1);

  t.ok(fn.calledWith(1, 'test-deps'));
});
