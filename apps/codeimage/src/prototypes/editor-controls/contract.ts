import type {Component} from 'solid-js';
import type {EditorControlsModel} from './model';
import type {Stage} from './stage';
import type {ThemePickerSlotProps} from './theme-styles/ThemePicker';

export interface VariantProps {
  readonly model: EditorControlsModel;
  readonly stage: Stage;
  /**
   * Every theme in the card style chosen in the settings: search, filter
   * and the list. Place it where the layout shows themes.
   */
  readonly ThemePicker: Component<ThemePickerSlotProps>;
}

export interface VariantMeta {
  /** The layout's name, as the settings show it. */
  readonly name: string;
  /** The design axis this variant explores, in a phrase. */
  readonly axis: string;
}

export interface Variant extends VariantMeta {
  readonly component: Component<VariantProps>;
}
