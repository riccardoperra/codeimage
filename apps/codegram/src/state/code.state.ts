import {createState, select, Store, withProps} from '@ngneat/elf';

interface TerminalState {
  code: string;
}

const {state, config} = createState(
  withProps<TerminalState>({
    code: 'console.log()',
  }),
);

const store = new Store({name: 'terminal', state, config});

export const useTerminalState = () => {
  return {store, state, config};
};

export const code$ = store.pipe(select(state => state.code));

export function setCode(code: string): void {
  store.update(() => ({code}));
}
