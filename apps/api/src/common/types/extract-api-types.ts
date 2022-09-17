import {Static, TSchema} from '@sinclair/typebox';
import {FastifySchema} from 'fastify';

type StaticSchemaOrType<T> = T extends TSchema ? Static<T> : T;

interface GetApiRequest<T extends FastifySchema> {
  body?: StaticSchemaOrType<T['body']>;
  querystring?: StaticSchemaOrType<T['querystring']>;
  params?: StaticSchemaOrType<T['params']>;
  headers?: StaticSchemaOrType<T['headers']>;
}

type GetApiResponse<T extends FastifySchema> = T['response'] extends {
  200: infer U;
}
  ? StaticSchemaOrType<U>
  : never;

export interface GetApiTypes<T extends FastifySchema> {
  request: GetApiRequest<T>;
  response: GetApiResponse<T>;
}
