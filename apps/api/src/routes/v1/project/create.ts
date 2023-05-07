import {FastifyPluginAsyncTypebox} from '@fastify/type-provider-typebox';
import {GetApiTypes} from '../../../common/types/extract-api-types.js';
import {
  ProjectCreateRequestSchema,
  ProjectCreateResponseSchema,
} from '../../../modules/project/schema/index.js';

const schema = {
  tags: ['Project'],
  summary: 'Create a new CodeImage project',
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
      preValidation: (req, reply) => fastify.authorize(req, reply),
      schema,
    },
    request => {
      const {appUser, body} = request;
      return fastify.projectService.createNewProject(appUser.id, body);
    },
  );
};

export default createRoute;
