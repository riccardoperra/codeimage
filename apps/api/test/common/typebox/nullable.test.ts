import {Type} from '@sinclair/typebox';
import t from 'tap';
import {Nullable} from '../../../src/common/typebox/nullable';

t.test('TypeBox nullable', async t => {
  t.test('should return nullable', async t => {
    const result = Nullable(Type.String());
    t.match(result.anyOf, [
      {
        type: 'string',
      },
      {
        type: 'null',
      },
    ]);
  });
});
