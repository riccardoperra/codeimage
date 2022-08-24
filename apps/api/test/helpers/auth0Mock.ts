import {mockAuthProvider} from '../../src/plugins/auth0';

export const auth0Mock = (t: Tap.Test) => mockAuthProvider(t.context.user);
