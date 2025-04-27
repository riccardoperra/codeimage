import {Popover, PopoverContent, PopoverTrigger} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import clsx from 'clsx';
import {type FlowProps, type ValidComponent} from 'solid-js';
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
      <PopoverTrigger as={props.input} />

      <PopoverContent
        variant={'bordered'}
        class={clsx(styles.sidebarPopover, props.contentClass)}
      >
        {props.children}
      </PopoverContent>
    </Popover>
  );
}
