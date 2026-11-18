import type {Element as JSXElement} from 'solid-js';
import {mountOwnedView} from '@core/helpers/mount-owned-view';
import {duration} from '@ui/Dialog/Dialog.css';
import {
  createComponent,
  createSignal,
  getOwner,
  merge,
  onCleanup,
} from 'solid-js';

export interface ControlledDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function createControlledDialog() {
  const owner = getOwner();
  const active = new Set<() => void>();
  onCleanup(() => {
    for (const dispose of active) dispose();
  });

  return <T extends ControlledDialogProps>(
    dialogEl: (props: T) => JSXElement,
    props:
      | ((
          setter: (open: boolean) => void,
        ) => Omit<T, keyof ControlledDialogProps>)
      | Omit<T, keyof ControlledDialogProps>,
  ) => {
    if (!owner) return;
    const [isOpen, setOpen] = createSignal(true);
    let disposeRender: (() => void) | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    const dispose = () => {
      clearTimeout(closeTimer);
      active.delete(dispose);
      disposeRender?.();
    };
    const onOpenChange = (open: boolean) => {
      setOpen(open);
      clearTimeout(closeTimer);
      if (!open) closeTimer = setTimeout(dispose, duration + 16);
    };
    const resolvedProps =
      typeof props === 'function' ? props(onOpenChange) : props;

    const mergedProps = merge(resolvedProps, {
      get isOpen() {
        return isOpen();
      },
      onOpenChange,
    });
    disposeRender = mountOwnedView(owner, document.createElement('div'), () =>
      createComponent(dialogEl, mergedProps as T),
    );
    active.add(dispose);
  };
}
