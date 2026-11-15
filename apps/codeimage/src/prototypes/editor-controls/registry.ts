import type {Variant} from './contract';
import type {LayoutId} from './shell/preferences';
import Dock, {meta as dock} from './variants/dock';
import Inspector, {meta as inspector} from './variants/inspector';
import Studio, {meta as studio} from './variants/studio';

// Names and axes live in each layout's folder. Today's editor is no longer a
// layout here: it is the production route `/classic`.
export const layouts: Record<LayoutId, Variant> = {
  inspector: {...inspector, component: Inspector},
  dock: {...dock, component: Dock},
  studio: {...studio, component: Studio},
};
