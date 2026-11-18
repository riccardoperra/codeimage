import {createSignal, onCleanup} from 'solid-js';

export type HeaderAction = 'commands' | 'settings' | 'experiments';
const [hosted, setHosted] = createSignal<readonly HeaderAction[]>([], {
  ownedWrite: true,
});

export const headerHosts = (action: HeaderAction) => !hosted().includes(action);

/** A mounted layout entry owns its action until it leaves the screen. */
export function claimHeaderActions(actions: readonly HeaderAction[]): void {
  setHosted(current => [...current, ...actions]);
  onCleanup(() =>
    setHosted(current => {
      const remaining = [...current];
      for (const action of actions) {
        const index = remaining.indexOf(action);
        if (index !== -1) remaining.splice(index, 1);
      }
      return remaining;
    }),
  );
}
