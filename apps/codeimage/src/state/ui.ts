import {createStore, select, setProp, withProps} from '@ngneat/elf';
import {distinctUntilChanged, shareReplay} from 'rxjs';
import shallow from '../core/helpers/shallow';
import {localStorageStrategy, persistState} from '@ngneat/elf-persist-state';

export interface GlobalUiState {
  themeMode: 'light' | 'dark';
  locale: string;
}

const initialState: GlobalUiState = {
  themeMode: 'dark',
  locale: 'en',
};

const store = createStore({name: 'ui'}, withProps<GlobalUiState>(initialState));

persistState(store, {key: '@store/ui', storage: localStorageStrategy});

export const ui$ = store.pipe(distinctUntilChanged(shallow));
export const locale$ = ui$.pipe(select(state => state.locale));
export const themeMode$ = ui$.pipe(
  select(state => state.themeMode),
  shareReplay({refCount: true, bufferSize: 1}),
);

export function setLocale(locale: string): void {
  return store.update(setProp('locale', locale));
}

export function toggleThemeMode(): void {
  return store.update(
    setProp('themeMode', mode => (mode === 'light' ? 'dark' : 'light')),
  );
}
