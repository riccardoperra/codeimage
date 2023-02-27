import {Type} from '@sinclair/typebox';

export const BaseResponse = {
  id: Type.String({format: 'uuid'}),
  name: Type.String(),
  createdAt: Type.Unsafe<Date | string>({format: 'date-time'}),
  updatedAt: Type.Unsafe<Date | string>({format: 'date-time'}),
  ownerId: Type.String({format: 'uuid'}),
};
