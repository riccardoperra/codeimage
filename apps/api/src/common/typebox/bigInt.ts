import {TypeSystem} from '@sinclair/typebox/system';

export const BigNumber = TypeSystem.CreateType<bigint>(
  'BigNumber',
  (options, value) => {
    return typeof value === 'bigint';
  },
);
