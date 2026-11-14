import type {Variant} from '../editor-controls/contract';
import type {ThemeStyleId} from '../editor-controls/theme-styles/style';
import {THEME_STYLES} from '../editor-controls/theme-styles/style';
import {ThemePickerScreen} from './ThemePickerScreen';

// A width a real panel would have, chosen per style.
const ISLAND_WIDTH: Record<ThemeStyleId, number> = {
  orb: 360,
  aa: 320,
  window: 360,
};

/** The same three picker bodies the layouts show, each alone beside the canvas. */
export const directions: readonly Variant[] = THEME_STYLES.map(style => ({
  name: style.name,
  axis: style.axis,
  component: props => (
    <ThemePickerScreen
      {...props}
      style={style.id}
      width={ISLAND_WIDTH[style.id]}
    />
  ),
}));
