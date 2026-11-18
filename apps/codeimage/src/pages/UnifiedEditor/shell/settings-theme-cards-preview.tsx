import {Match, Switch} from 'solid-js';
import type {ThemeEntry} from '../model';
import {ThemeSwatch} from '../ThemeSwatch';
import type {ThemeCardsId} from './preferences';
import * as styles from './settings.css';

export function ThemeCardsPreview(props: {
  style: ThemeCardsId;
  theme: ThemeEntry;
}) {
  return (
    <Switch>
      <Match when={props.style === 'window'}>
        <ThemeSwatch
          theme={props.theme}
          variant="window"
          size={48}
          width={68}
        />
      </Match>
      <Match when={props.style === 'orb'}>
        <ThemeSwatch theme={props.theme} variant="syntax-orb" size={44} />
      </Match>
      <Match when={props.style === 'aa'}>
        <span class={styles.listRow}>
          <ThemeSwatch theme={props.theme} variant="aa" size={28} />
          <span class={styles.listLine} />
        </span>
      </Match>
    </Switch>
  );
}
