import {Popover} from '@ui/Popover';
import {useModality} from '@core/hooks/isMobile';
import clsx from 'clsx';
import type {FlowProps} from 'solid-js';
import type {ValidComponent} from '@solidjs/web';
import * as styles from './SidebarPopover.css';

interface SidebarPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: ValidComponent;
  contentClass?: string;
  modalOnDesktop?: boolean;
}

export function SidebarPopover(props: FlowProps<SidebarPopoverProps>) {
  const modality = useModality();

  return (
    <Popover
      placement={modality === 'mobile' ? undefined : 'right-end'}
      open={props.open}
      modal={props.modalOnDesktop && modality === 'full'}
      onOpenChange={open => props.onOpenChange(open)}
    >
      <Popover.Trigger as={props.input} />

      <Popover.Portal>
        <Popover.Content
          class={clsx(styles.sidebarPopover, props.contentClass)}
        >
          {props.children}
        </Popover.Content>
      </Popover.Portal>
    </Popover>
  );
}
