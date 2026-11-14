import type {ThemeEntry} from './model';
import './theme-swatch.css';

interface ThemeSwatchProps {
  theme: ThemeEntry;
  /** Diameter in px. Defaults to 56. */
  size?: number;
}

/**
 * A colour orb for one theme: the frame background fills it, and the window
 * colour sits in the lower right. A code thumbnail at tile size does not say
 * which theme it is, and the live canvas already is the preview.
 */
export function ThemeSwatch(props: ThemeSwatchProps) {
  return (
    <span
      class="proto-theme-swatch"
      aria-hidden="true"
      style={{
        '--swatch-size': `${props.size ?? 56}px`,
        '--swatch-frame': props.theme.colors.background,
        '--swatch-window': props.theme.colors.window,
        '--swatch-text': props.theme.colors.text,
      }}
    >
      <span class="proto-theme-swatch-window" />
      <span class="proto-theme-swatch-text" />
    </span>
  );
}
