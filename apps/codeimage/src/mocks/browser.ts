import {setupWorker} from 'msw/browser';
import {hydrateDb} from './persist';
import projectHandlers from './projectMockHandlers';

export const worker = setupWorker(...projectHandlers);

export async function startMockApi() {
  await hydrateDb();
  await worker.start();
}
