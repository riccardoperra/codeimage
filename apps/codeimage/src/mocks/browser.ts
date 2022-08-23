import {setupWorker} from 'msw';
import {db} from './db';
import {persistMswjs} from './persist';
import projectHandlers from './projectMockHandlers';

export const worker = setupWorker(...projectHandlers);
persistMswjs(db);
