import {setupWorker} from 'msw/browser';
import {hydrateDb} from './persist';
import projectHandlers from './projectMockHandlers';
import signatureHandlers, {hydrateSignatures} from './signatureMockHandlers';

export const worker = setupWorker(...projectHandlers, ...signatureHandlers);

export async function startMockApi() {
  await Promise.all([hydrateDb(), hydrateSignatures()]);
  await worker.start();
}
