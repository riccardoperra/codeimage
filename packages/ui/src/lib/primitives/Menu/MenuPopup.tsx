import {ForItems} from '@solid-aria/collection';
import {FocusScope} from '@solid-aria/focus';
import {AriaMenuProps, createMenu} from '@solid-aria/menu';
import {
  AriaOverlayProps,
  createOverlay,
  DismissButton,
} from '@solid-aria/overlays';
import {UseFloatingReturn} from '../../hooks/useFloating';
import {styled} from '../../utils';
import {MenuItem} from './MenuItem';
import * as styles from './MenuPopup.css';

export function MenuPopup(
  props: AriaMenuProps & AriaOverlayProps & {floating: UseFloatingReturn},
) {
  let ref: HTMLUListElement | undefined;

  // Get props for the menu element
  const {MenuProvider, menuProps, state} = createMenu(props, () => ref);

  // Handle events that should cause the menu to close,
  // e.g. blur, clicking outside, or pressing the escape key.
  let overlayRef: HTMLDivElement | undefined;
  const {overlayProps} = createOverlay(
    {
      onClose: props.onClose,
      shouldCloseOnBlur: true,
      isOpen: true,
      isDismissable: true,
    },
    () => overlayRef,
  );

  // Wrap in <FocusScope> so that focus is restored back to the
  // trigger when the menu is closed. In addition, add hidden
  // <DismissButton> components at the start and end of the list
  // to allow screen reader users to dismiss the popup easily.
  return (
    <MenuProvider>
      <FocusScope restoreFocus>
        <styled.div {...overlayProps} ref={overlayRef}>
          <DismissButton onDismiss={props.onClose} />
          <styled.ul
            {...menuProps}
            ref={(ulRef: HTMLUListElement) => {
              ref = ulRef;
              props.floating.setFloating(ref);
            }}
            class={styles.menuList}
            style={{
              position: props.floating.strategy,
              left: `${props.floating.x ?? 0}px`,
              top: `${props.floating.y ?? 0}px`,
            }}
          >
            <ForItems in={state.collection()}>
              {item => (
                <MenuItem
                  key={item().key}
                  onAction={props.onAction}
                  onClose={props.onClose}
                >
                  {item().children}
                </MenuItem>
              )}
            </ForItems>
          </styled.ul>
          <DismissButton onDismiss={props.onClose} />
        </styled.div>
      </FocusScope>
    </MenuProvider>
  );
}
