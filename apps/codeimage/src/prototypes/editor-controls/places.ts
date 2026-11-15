import type {ShippedWhere} from '../../state/whats-new';
import type {ControlId} from './model';
import type {ExportItem} from './shell/ExportControl';
import type {SettingRowId} from './shell/sections';

export type UnifiedWhere =
  | 'command-menu'
  | 'export'
  | `export:${ExportItem}`
  | `control:${ControlId}`
  | `setting:${Exclude<SettingRowId, `news-${string}`>}`;

export type EveryHighlightIsPlaced = Placed<ShippedWhere>;
type Placed<W extends UnifiedWhere> = W;
