import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';

import {nightOwlTheme} from '@codeimage/highlight/nightOwl';

const schema = {
  tags: ['Preset'],
  summary: 'Get all CodeImage presets filtered by current user',
};

export type GetAllPresetApi = GetApiTypes<typeof schema>;

const getByIdRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.get(
    '/themes',
    {
      schema,
    },
    async request => {
      return [nightOwlTheme];
    },
  );
};

export default getByIdRoute;
