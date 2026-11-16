import type {Variant} from './contract';
import type {LayoutId} from './shell/preferences';
import Dock, {meta as dock} from './variants/dock';
import Sidebar, {meta as sidebar} from './variants/sidebar';

// Names and axes live in each layout's folder.
export const layouts: Record<LayoutId, Variant> = {
  sidebar: {...sidebar, component: Sidebar},
  dock: {...dock, component: Dock},
};
