import {AVAILABLE_COLORS, AVAILABLE_GRADIENTS} from '@codeimage/config';
import {ColorPicker} from '@codeimage/ui';
import {Middleware} from '@floating-ui/dom';
import {SIDEBAR_POPOVER_HOST_ID} from '../SidebarPopoverHost';

export type CustomColorPickerProps = Parameters<typeof ColorPicker>[0];

export function CustomColorPicker(props: CustomColorPickerProps) {
  const resetFloatingHorizontalSpace: Middleware = {
    name: 'reset-h-space',
    fn: () => ({x: 0}),
  };

  return (
    <ColorPicker
      colors={AVAILABLE_COLORS}
      gradients={AVAILABLE_GRADIENTS}
      popoverRoot={SIDEBAR_POPOVER_HOST_ID}
      popoverPlacement={'right-start'}
      popoverMiddlewares={[resetFloatingHorizontalSpace]}
      {...props}
    />
  );
}
