import {Show} from 'solid-js';
import {modeIcon} from './screen.css';

/** A moon for a dark theme, a sun for a light one. */
export function ModeIcon(props: {dark: boolean; size?: number}) {
  return (
    <svg
      class={modeIcon}
      width={props.size ?? 14}
      height={props.size ?? 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      role="img"
      aria-label={props.dark ? 'Dark theme' : 'Light theme'}
    >
      <Show
        when={props.dark}
        fallback={
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        }
      >
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </Show>
    </svg>
  );
}
