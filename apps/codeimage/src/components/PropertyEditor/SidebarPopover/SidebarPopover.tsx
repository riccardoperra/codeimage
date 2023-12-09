import {Popover, PopoverContent, PopoverTrigger} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import clsx from 'clsx';
import {FlowProps, JSXElement} from 'solid-js';
import * as styles from './SidebarPopover.css';

interface SidebarPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: JSXElement;
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
      <PopoverTrigger asChild>{props.input}</PopoverTrigger>

      <PopoverContent
        variant={'bordered'}
        class={clsx(styles.sidebarPopover, props.contentClass)}
      >
        {props.children}
      </PopoverContent>
    </Popover>
  );
}
