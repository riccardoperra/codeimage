import {
  createOverlayTriggerState,
  OverlayContainer,
  OverlayTriggerState,
} from '@solid-aria/overlays';
import {
  createComponent,
  getOwner,
  JSXElement,
  mergeProps,
  runWithOwner,
  Show,
} from 'solid-js';

export function createStandaloneDialog() {
  const owner = getOwner();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <T extends (props: any) => JSXElement>(
    dialogEl: T,
    props: (state: OverlayTriggerState) => Parameters<T>[0],
  ) => {
    if (!owner) return;
    return runWithOwner(owner, () => {
      const overlayState = createOverlayTriggerState({defaultOpen: true});
      createComponent(Show, {
        get when() {
          return overlayState.isOpen();
        },
        get children() {
          return createComponent(OverlayContainer, {
            get children() {
              return createComponent(
                dialogEl,
                // eslint-disable-next-line solid/reactivity
                mergeProps(
                  {
                    onClose: () => {
                      overlayState.close();
                    },
                  },
                  props(overlayState),
                ),
              );
            },
          });
        },
      });
    });
  };
}
