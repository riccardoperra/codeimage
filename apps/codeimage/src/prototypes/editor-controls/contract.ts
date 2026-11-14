import type {Component} from 'solid-js';
import type {EditorControlsModel} from './model';
import type {Stage} from './stage';

export interface VariantProps {
  readonly model: EditorControlsModel;
  readonly stage: Stage;
}

export interface VariantMeta {
  /** Shown in the picker. */
  readonly name: string;
  /** The design axis this variant explores, in a phrase. */
  readonly axis: string;
}

export interface Variant extends VariantMeta {
  readonly component: Component<VariantProps>;
}
