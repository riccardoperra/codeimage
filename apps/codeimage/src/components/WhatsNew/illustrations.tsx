import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import type {Component, JSX} from 'solid-js';
import {
  For,
  Match,
  Switch,
  onCleanup,
  onMount,
  createSignal,
  Show,
} from 'solid-js';
import type {ContentHighlightId} from '../../state/whats-new/registry';
import * as styles from './illustrations.css';

export type IllustrationMode = 'play' | 'still' | 'thumb';
interface IllustrationProps {
  readonly mode?: IllustrationMode;
}

/** A single explanation on first intersection; the resting drawing is complete. */
function Frame(
  props: IllustrationProps & {id: ContentHighlightId; children: JSX.Element},
) {
  let frame!: HTMLDivElement;
  const [playing, setPlaying] = createSignal(false);
  onMount(() => {
    if (props.mode !== 'play') return;
    const observer = new IntersectionObserver(
      entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        setPlaying(true);
        observer.disconnect();
      },
      {threshold: 0.25},
    );
    observer.observe(frame);
    onCleanup(() => observer.disconnect());
  });
  return (
    <div
      ref={frame}
      class={styles.frame}
      data-picture={props.id}
      data-mode={props.mode ?? 'still'}
      data-playing={playing() ? '' : undefined}
      aria-hidden="true"
    >
      {props.children}
    </div>
  );
}

function Bar(props: {width: string}) {
  return <i class={styles.bar} style={{width: props.width}} />;
}
function Bars() {
  return (
    <>
      <Bar width="68%" />
      <Bar width="46%" />
      <Bar width="58%" />
    </>
  );
}
function Tile(props: {tone?: number; children?: JSX.Element; class?: string}) {
  return (
    <div
      class={`${styles.tile} ${props.class ?? ''}`}
      data-tone={props.tone ?? 0}
    >
      {props.children}
    </div>
  );
}
function Chip(props: {children: JSX.Element; class?: string}) {
  return (
    <span class={`${styles.chip} ${props.class ?? ''}`}>{props.children}</span>
  );
}

/** Thumbnails are symbols drawn for 64×44, with no miniature labels. */
function Thumb(props: {id: ContentHighlightId}) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Switch>
      <Match when={props.id === 'marks'}>
        <Bar width="46%" />
        <div class={styles.removed}>
          <Bar width="58%" />
        </div>
        <div class={styles.added}>
          <Bar width="78%" />
        </div>
        <Bar width="34%" />
      </Match>
      <Match when={props.id === 'redact'}>
        <Bar width="64%" />
        <div class={styles.secretDots}>••••••</div>
        <Bar width="42%" />
      </Match>
      <Match when={props.id === 'social'}>
        <div class={styles.thumbSizes}>
          <Tile />
          <Tile />
          <Tile />
        </div>
      </Match>
      <Match when={props.id === 'tabs'}>
        <div class={styles.thumbTabs}>
          <i />
          <i />
          <i />
        </div>
        <div class={styles.tileRow}>
          <Tile />
          <Tile tone={1} />
          <Tile tone={2} />
        </div>
      </Match>
      <Match when={props.id === 'alt'}>
        <div class={styles.tileRow}>
          <Tile />
          <span class={styles.altSymbol}>{t('whatsNew.illustration.alt')}</span>
        </div>
      </Match>
      <Match when={props.id === 'cli'}>
        <div class={styles.prompt}>
          $ <span>_</span>
        </div>
        <Bar width="78%" />
        <Bar width="46%" />
      </Match>
      <Match when={props.id === 'signature'}>
        <Tile class={styles.signedTile}>
          <Bar width="70%" />
          <span class={styles.signatureSymbol}>@</span>
        </Tile>
      </Match>
      <Match when={props.id === 'window-styles'}>
        <div class={styles.tileRow}>
          <Tile>
            <div class={styles.traffic}>
              <i />
              <i />
              <i />
            </div>
            <Bar width="70%" />
          </Tile>
          <Tile tone={1}>
            <span class={styles.prompt}>›_</span>
          </Tile>
        </div>
      </Match>
      <Match when={props.id === 'command-menu'}>
        <div class={styles.commandSymbol}>⌘ K</div>
        <div class={styles.selected}>
          <Bar width="75%" />
        </div>
      </Match>
      <Match when={props.id === 'takumi'}>
        <div class={styles.tileRow}>
          <div class={styles.engineSymbol}>↗</div>
          <Tile>
            <Bar width="70%" />
            <Bar width="45%" />
          </Tile>
        </div>
      </Match>
      <Match when={props.id === 'layouts'}>
        <div class={styles.layoutShape} data-layout="inspector">
          <Tile />
          <i />
        </div>
      </Match>
      <Match when={props.id === 'theme-cards'}>
        <div class={styles.tileRow}>
          <Tile />
          <div class={styles.orb} />
          <span class={styles.aa}>Aa</span>
        </div>
      </Match>
      <Match when={props.id === 'animate'}>
        <div class={styles.tileRow}>
          <Tile />
          <Tile tone={1} />
        </div>
        <div class={styles.timeline}>
          <i />
          <i />
          <b />
        </div>
      </Match>
    </Switch>
  );
}

function Drawing(props: {id: ContentHighlightId}) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Switch>
      <Match when={props.id === 'marks'}>
        <Bar width="46%" />
        <div class={`${styles.removed} ${styles.explain}`}>
          <Bar width="38%" />
        </div>
        <div class={`${styles.added} ${styles.explain}`}>
          <Bar width="72%" />
        </div>
        <Bar width="60%" />
        <Bar width="24%" />
      </Match>
      <Match when={props.id === 'redact'}>
        <div class={styles.row}>
          <Bar width="34%" />
          <span class={styles.secret}>"sk_live_9aF3kQ2x"</span>
        </div>
        <Bar width="58%" />
        <Bar width="42%" />
        <Chip class={styles.explain}>
          {t('whatsNew.illustration.secretHidden')}
        </Chip>
      </Match>
      <Match when={props.id === 'social'}>
        <div class={`${styles.sizes} ${styles.explain}`}>
          <For each={['16:9', '1:1', '4:5']}>
            {ratio => (
              <Tile>
                <span style={{'aspect-ratio': ratio.replace(':', '/')}}>
                  {ratio}
                </span>
              </Tile>
            )}
          </For>
        </div>
      </Match>
      <Match when={props.id === 'tabs'}>
        <div class={styles.tabs}>
          <For each={['index.tsx', 'api.ts', 'types.ts']}>
            {file => <span>{file}</span>}
          </For>
        </div>
        <div class={`${styles.tileRow} ${styles.explain}`}>
          <Tile />
          <Tile tone={1} />
          <Tile tone={2} />
        </div>
      </Match>
      <Match when={props.id === 'alt'}>
        <div class={styles.row}>
          <Tile class={`${styles.altTile} ${styles.explain}`} />
          <q class={styles.altCopy}>
            {t('whatsNew.illustration.altDescription')}
          </q>
        </div>
        <Chip>{t('whatsNew.illustration.alt')}</Chip>
      </Match>
      <Match when={props.id === 'cli'}>
        <code class={styles.cli}>
          <b>$</b> codeimage snippet.ts --preset brand.json
        </code>
        <code class={`${styles.cli} ${styles.dim} ${styles.explain}`}>
          {t('whatsNew.illustration.cliOutput')}
        </code>
      </Match>
      <Match when={props.id === 'takumi'}>
        <div class={styles.engine}>
          <div class={styles.engineInput}>
            <Bars />
          </div>
          <span class={styles.engineArrow}>↗</span>
          <Tile class={`${styles.engineOutput} ${styles.explain}`}>
            <Bars />
            <Chip>PNG</Chip>
          </Tile>
        </div>
        <Chip>{t('whatsNew.illustration.optional')}</Chip>
      </Match>
      <Match when={props.id === 'signature'}>
        <Tile class={styles.signedTile}>
          <Bars />
          <div class={`${styles.signatures} ${styles.explain}`}>
            <span>@codeimage</span>
            <span>@codeimage</span>
            <span>
              <b>@</b> codeimage
            </span>
          </div>
        </Tile>
      </Match>
      <Match when={props.id === 'window-styles'}>
        <div class={`${styles.tileRow} ${styles.explain}`}>
          <For each={[0, 1, 2]}>
            {tone => (
              <Tile tone={tone} class={styles.windowTile}>
                <Show
                  when={tone === 0}
                  fallback={
                    <span class={styles.windowTab}>
                      {tone === 1 ? 'index.tsx' : '› _'}
                    </span>
                  }
                >
                  <div class={styles.traffic}>
                    <i />
                    <i />
                    <i />
                  </div>
                </Show>
                <Bars />
              </Tile>
            )}
          </For>
        </div>
      </Match>
      <Match when={props.id === 'command-menu'}>
        <div class={styles.command}>
          <div class={styles.commandSearch}>
            <Bar width="48%" />
            <span class={styles.key}>⌘ K</span>
          </div>
          <div class={`${styles.selected} ${styles.explain}`}>
            <span>↗</span>
            {t('whatsNew.illustration.exportImage')}
            <span>↵</span>
          </div>
          <Bar width="56%" />
        </div>
      </Match>
      <Match when={props.id === 'layouts'}>
        <div class={styles.layouts}>
          <For each={['inspector', 'dock', 'studio'] as const}>
            {layout => (
              <div class={styles.layoutOption}>
                <div
                  class={`${styles.layoutShape} ${styles.explain}`}
                  data-layout={layout}
                >
                  <Tile>
                    <Bars />
                  </Tile>
                  <i />
                  <Show when={layout === 'studio'}>
                    <b />
                  </Show>
                </div>
                <span>{t(`editor.${layout}`)}</span>
              </div>
            )}
          </For>
        </div>
      </Match>
      <Match when={props.id === 'theme-cards'}>
        <div class={styles.themes}>
          <Tile class={styles.themeTile}>
            <Bars />
          </Tile>
          <div class={`${styles.orb} ${styles.explain}`} />
          <span class={styles.aa}>Aa</span>
        </div>
      </Match>
      <Match when={props.id === 'animate'}>
        <div class={styles.tileRow}>
          <Tile class={styles.animationTile}>
            <Bars />
          </Tile>
          <span class={styles.engineArrow}>→</span>
          <Tile tone={1} class={styles.animationTile}>
            <Bars />
          </Tile>
        </div>
        <div class={styles.timeline}>
          <i />
          <i />
          <i />
          <b class={styles.playhead} />
        </div>
      </Match>
    </Switch>
  );
}

function picture(id: ContentHighlightId): Component<IllustrationProps> {
  return props => (
    <Frame {...props} id={id}>
      <Show when={props.mode === 'thumb'} fallback={<Drawing id={id} />}>
        <Thumb id={id} />
      </Show>
    </Frame>
  );
}

export const illustrations = {
  marks: picture('marks'),
  redact: picture('redact'),
  social: picture('social'),
  tabs: picture('tabs'),
  alt: picture('alt'),
  cli: picture('cli'),
  takumi: picture('takumi'),
  signature: picture('signature'),
  'window-styles': picture('window-styles'),
  'command-menu': picture('command-menu'),
  layouts: picture('layouts'),
  'theme-cards': picture('theme-cards'),
  animate: picture('animate'),
} satisfies Record<ContentHighlightId, Component<IllustrationProps>>;
