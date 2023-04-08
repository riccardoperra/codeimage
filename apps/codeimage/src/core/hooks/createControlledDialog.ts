import {
  createComponent,
  createSignal,
  getOwner,
  JSXElement,
  mergeProps,
  runWithOwner,
} from 'solid-js';

export interface ControlledDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function createControlledDialog() {
  const owner = getOwner();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <T extends ControlledDialogProps>(
    dialogEl: (props: T) => JSXElement,
    props:
      | ((
          setter: (open: boolean) => void,
        ) => Omit<T, keyof ControlledDialogProps>)
      | Omit<T, keyof ControlledDialogProps>,
  ) => {
    if (!owner) return;
    return runWithOwner(owner, () => {
      const [isOpen, onOpenChange] = createSignal<boolean>(true);
      const resolvedProps =
        props instanceof Function ? props(onOpenChange) : props;

      const propsWithDefault = mergeProps(resolvedProps, {
        get isOpen() {
          return isOpen();
        },
        onOpenChange,
      });
      createComponent(dialogEl, propsWithDefault as T);
    });
  };
}
