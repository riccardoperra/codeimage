import type {Variant} from './contract';
import Current, {meta as current} from './variants/current';
import Dock, {meta as dock} from './variants/dock';
import Inspector, {meta as inspector} from './variants/inspector';
import Studio, {meta as studio} from './variants/studio';

// Names and axes live in each variant's folder, so builders never edit this file.
export const variants: readonly Variant[] = [
  {...current, component: Current},
  {...inspector, component: Inspector},
  {...dock, component: Dock},
  {...studio, component: Studio},
];
