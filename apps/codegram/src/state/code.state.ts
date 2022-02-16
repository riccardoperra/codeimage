import {createState, select, Store, withProps} from '@ngneat/elf';
import {Extension} from '@codemirror/state';
import {createSignal} from 'solid-js';

export const [extensions, setExtensions] = createSignal<Extension>([]);

interface TerminalState {
  code: string;
}

const {state, config} = createState(
  withProps<TerminalState>({
    code: 'console.log()',
  }),
);

const store = new Store({name: 'terminal', state, config});

export const code$ = store.pipe(select(state => state.code));

export function setCode(code: string): void {
  store.update(state => ({...state, code}));
}
