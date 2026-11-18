import type {Solid2Mount} from '@core/solid2-islands/contracts';
import type {ProjectActionsMenuProps} from '../Dashboard/components/ProjectItem/ProjectActionsMenu';
import type {ReadOnlyNoticeProps} from './read-only-notice-props';

export const mountReadOnlyNotice: Solid2Mount<ReadOnlyNoticeProps>;

export const mountProjectMenu: Solid2Mount<
  Omit<ProjectActionsMenuProps, 'onCloseAutoFocus'>
>;
