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

  return <T extends (props: {}) => JSXElement>(
    dialogEl: T,
    props: (state: OverlayTriggerState) => Parameters<T>[0],
  ) =>
    runWithOwner(owner!, () => {
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
}
