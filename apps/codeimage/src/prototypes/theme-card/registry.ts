import type {Variant} from '../editor-controls/contract';
import AaList, {meta as aaList} from './directions/aa-list';
import Code, {meta as code} from './directions/code';
import Orb, {meta as orb} from './directions/orb';
import Palette, {meta as palette} from './directions/palette';
import Window, {meta as window} from './directions/window';

export const directions: readonly Variant[] = [
  {...code, component: Code},
  {...orb, component: Orb},
  {...aaList, component: AaList},
  {...palette, component: Palette},
  {...window, component: Window},
];
