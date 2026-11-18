import type {Solid2Mount} from '@core/solid2-islands/contracts';
import type {ProjectActionsMenuProps} from '../Dashboard/components/ProjectItem/ProjectActionsMenu';
import type {ReadOnlyNoticeProps} from './read-only-notice-props';
import type {SettingsSearchProps} from './shell/settings-search-props';

export const mountReadOnlyNotice: Solid2Mount<ReadOnlyNoticeProps>;

export const mountSettingsSearch: Solid2Mount<SettingsSearchProps>;

export const mountProjectMenu: Solid2Mount<
  Omit<ProjectActionsMenuProps, 'onCloseAutoFocus'>
>;
