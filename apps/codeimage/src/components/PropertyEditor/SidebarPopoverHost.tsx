import * as styles from './SidebarPopoverHost.css';

export const SIDEBAR_POPOVER_HOST_ID = 'sidebar-popover-host';

export function SidebarPopoverHost() {
  return <div class={styles.wrapper} id={SIDEBAR_POPOVER_HOST_ID} />;
}
