import {createSignal, onCleanup} from 'solid-js';

export type HeaderAction = 'settings' | 'experiments';
const [hosted, setHosted] = createSignal<readonly HeaderAction[]>([]);

export const headerHosts = (action: HeaderAction) => !hosted().includes(action);

/** A mounted layout entry owns its action until it leaves the screen. */
export function claimHeaderActions(actions: readonly HeaderAction[]): void {
  setHosted(current => [...current, ...actions]);
  onCleanup(() =>
    setHosted(current => {
      const remaining = [...current];
      for (const action of actions)
        remaining.splice(remaining.indexOf(action), 1);
      return remaining;
    }),
  );
}
