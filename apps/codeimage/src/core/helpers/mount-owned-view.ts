import {
  insert,
  registerDelegatedRoot,
  unregisterDelegatedRoot,
  type JSX,
} from '@solidjs/web';
import {createRoot, flush, type Owner, runWithOwner} from 'solid-js';

export function mountOwnedView(
  owner: Owner | null,
  element: HTMLElement,
  content: () => JSX.Element,
) {
  registerDelegatedRoot(element);
  let disposeRoot: (() => void) | undefined;
  const dispose = () => {
    disposeRoot?.();
    unregisterDelegatedRoot(element);
    element.replaceChildren();
  };

  try {
    runWithOwner(owner, () =>
      createRoot(dispose => {
        disposeRoot = dispose;
        insert(element, content, undefined, undefined, {schedule: true});
      }),
    );
    runWithOwner(null, flush);
    return dispose;
  } catch (error) {
    dispose();
    throw error;
  }
}
