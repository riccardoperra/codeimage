/**
 * The preset module. Wiring only: read infrastructure decorators once, call factories with explicit
 * arguments, decorate the service. Decorators stop here: the service never sees `fastify`.
 */
import fp from 'fastify-plugin';
import {createPresetRepository} from './preset.repository.js';
import {createPresetService, type PresetService} from './preset.service.js';

declare module 'fastify' {
  interface FastifyInstance {
    /** Preset module interface: the only way routes and other modules reach presets. */
    preset: PresetService;
  }
}

export default fp(
  async fastify => {
    fastify.decorate(
      'preset',
      createPresetService({
        presets: createPresetRepository(fastify.db),
        limit: fastify.config.PRESETS_LIMIT,
      }),
    );
  },
  {name: 'preset', dependencies: ['config', 'db']},
);

// What other folders may import. Everything else in this folder is private (architecture test).
export {default as presetRoutes} from './preset.routes.js';
export {presetContract} from './preset.contract.js';
export type {PresetService} from './preset.service.js';
export type {Preset} from './preset.model.js';
