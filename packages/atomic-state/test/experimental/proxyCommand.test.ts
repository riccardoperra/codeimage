import {describe, expect, it} from 'vitest';
import {createExperimentalStore} from '../../src/experimental';
import {withProxyCommands} from '../../src/experimental';

type Commands = {
  setFirstName: string;
  setLastName: string;
};

describe('proxyCommand', () => {
  const initialObject = {
    firstName: 'Mario',
    lastName: 'Rossi',
  };

  const store = createExperimentalStore(initialObject).extend(
    withProxyCommands<Commands>(),
  );

  store.hold(store.commands.setFirstName, (payload, state) => {
    return {...state, firstName: payload};
  });

  store.hold(store.commands.setLastName, (payload, state) => {
    return {...state, lastName: payload};
  });

  it('should update state', () => {
    store.actions.setFirstName('updated');
    store.actions.setLastName('updated 2');
    expect(store.state.firstName).toBe('updated');
    expect(store.state.lastName).toBe('updated 2');
  });

  it('should not lose proxied getters while spreading', () => {
    function $innerStore() {
      return {...store.actions};
    }

    const innerStore = $innerStore();

    innerStore.setFirstName('updated');
    expect(store.state.firstName).toBe('updated');
  });
});
