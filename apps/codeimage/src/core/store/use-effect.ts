import {Effect, registerEffects, removeEffects} from '@ngneat/effects';
import {createEffect, onCleanup} from 'solid-js';

export function useEffects(effects: Effect | Effect[]) {
  createEffect(() => registerEffects(effects));
  onCleanup(() => removeEffects(effects));
}
