import {mergeProps} from 'solid-js';
import {
  createFloatingPortalNode,
  CreateFloatingPortalNodeProps,
} from '../../floating/floating-portal';

export const DEFAULT_PORTAL_POPOVER_ID = 'floating-portal-popover';

export function createPopoverPortal(props?: CreateFloatingPortalNodeProps) {
  const propsWithDefault = mergeProps(
    {
      id: DEFAULT_PORTAL_POPOVER_ID,
    },
    props,
  );

  return createFloatingPortalNode(propsWithDefault);
}
