import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types';
import {
  ProjectCreateRequestSchema,
  ProjectCreateResponseSchema,
} from '../../../modules/project/schema';

const schema = {
  tags: ['Project'],
  description: 'Create a new CodeImage project',
  body: ProjectCreateRequestSchema,
  response: {
    200: ProjectCreateResponseSchema,
  },
};

export type CreateProjectApi = GetApiTypes<typeof schema>;

const createRoute: FastifyPluginAsyncTypebox = async fastify => {
  fastify.post(
    '/',
    {
      preHandler: req => fastify.authorize(req),
      schema,
    },
    async request => {
      const {userId, body} = request;
      return fastify.projectService.createNewProject(userId, body);
    },
  );
};

export default createRoute;
