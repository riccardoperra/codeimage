import {describe, expect, it} from 'vitest';
import {createCommand, createExperimentalStore} from '../../src/experimental';
import {withFluentCommands} from '../../src/experimental/commands';

describe('proxyCommand', () => {
  const initialObject = {
    firstName: 'Mario',
    lastName: 'Rossi',
  };

  const setFirstName = createCommand('setFirstName').withPayload<string>();

  const store = createExperimentalStore(initialObject)
    .extend(withFluentCommands())
    .on(setFirstName, (command, state) => ({
      ...state,
      firstName: command,
    }));

  it('should update state', () => {
    store.actions.setFirstName('updated');
    expect(store.state.firstName).toBe('updated');
  });
});
