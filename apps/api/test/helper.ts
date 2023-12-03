// This file contains code that we reuse between our tests.
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import {TestContext} from 'vitest';
import App from '../src/app.js';
import {auth0Mock} from './helpers/auth0Mock.js';

// Fill in this config with all the configurations
// needed for testing the application
async function config(t: any) {
  return {
    authProvider: auth0Mock(t as any),
  };
}

// Automatically build and tear down our instance
async function build(t: TestContext) {
  const app = Fastify();

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  await app.register(fp(App), await config(t));

  await app.ready();

  return app;
}

export {config, build};
