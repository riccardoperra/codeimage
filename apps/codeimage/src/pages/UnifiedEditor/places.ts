import type {ShippedWhere} from '../../state/whats-new';
import type {ControlId} from './model';
import type {ExportItem} from './shell/export-actions';
import type {SettingRowId} from './shell/sections';

export type UnifiedWhere =
  | 'editor:line-marks'
  | 'command-menu'
  | 'export'
  | `export:${ExportItem}`
  | `control:${ControlId}`
  | `setting:${Exclude<SettingRowId, `news-${string}`>}`;

export type EveryHighlightIsPlaced = Placed<ShippedWhere>;
type Placed<W extends UnifiedWhere> = W;

// A row id written without `as const` widens every id to string, and then
// any `setting:` place would compile.
export type SettingRowIdsAreLiteral = Literal<SettingRowId>;
type Literal<T extends (string extends T ? 'every row id as const' : string)> =
  T;
