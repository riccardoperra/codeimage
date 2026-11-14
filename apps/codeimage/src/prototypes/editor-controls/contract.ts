import type {Component} from 'solid-js';
import type {EditorControlsModel} from './model';
import type {Stage} from './stage';
import type {ThemePickerSlotProps} from './theme-styles/ThemePicker';

export interface VariantProps {
  readonly model: EditorControlsModel;
  readonly stage: Stage;
  /**
   * Every theme in the style chosen in the harness's theme style picker:
   * search, filter and the list. Place it where the layout shows themes.
   */
  readonly ThemePicker: Component<ThemePickerSlotProps>;
}

export interface VariantMeta {
  /** Shown in the picker. */
  readonly name: string;
  /** The design axis this variant explores, in a phrase. */
  readonly axis: string;
  /** Renders its own theme picker, so the theme style picker does nothing for it. */
  readonly ownThemePicker?: boolean;
  /** Gets no command menu from the harness: today's editor has none. */
  readonly noCommandMenu?: boolean;
}

export interface Variant extends VariantMeta {
  readonly component: Component<VariantProps>;
}
