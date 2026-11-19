import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import type {Component} from 'solid-js';
import type {JSX} from '@solidjs/web';
import {For, Match, Switch, Show} from 'solid-js';
import type {ContentHighlightId} from '@codeimage/store/whats-new/registry';
import {IllustrationFrame, type IllustrationProps} from './IllustrationFrame';
import * as styles from './illustrations.css';

const cx = (...names: (string | undefined)[]) =>
  names.filter(Boolean).join(' ');

function Bar(props: {width: string; class?: string; children?: JSX.Element}) {
  return (
    <i class={cx(styles.bar, props.class)} style={{width: props.width}}>
      {props.children}
    </i>
  );
}
function Tile(props: {tone?: number; children?: JSX.Element; class?: string}) {
  return (
    <div class={cx(styles.tile, props.class)} data-tone={props.tone ?? 0}>
      {props.children}
    </div>
  );
}
/** Code on its canvas. */
function Code(props: {
  lines?: readonly string[];
  /** A window with its own fill, for the pictures about the window itself. */
  window?: boolean;
  class?: string;
  children?: JSX.Element;
}) {
  return (
    <div class={cx(props.window ? styles.win : styles.code, props.class)}>
      {props.children}
      <For each={props.lines ?? ['68%', '46%', '58%']}>
        {width => <Bar width={width} />}
      </For>
    </div>
  );
}
function Chip(props: {children: JSX.Element}) {
  return <span class={styles.chip}>{props.children}</span>;
}
function PlayGlyph() {
  return (
    <svg viewBox="0 0 10 10">
      <path d="M2.5 1.2v7.6L9 5z" />
    </svg>
  );
}
function Chevron() {
  return (
    <svg viewBox="0 0 6 6">
      <path d="M1.5 1 4.5 3l-3 2" />
    </svg>
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
          <i class={styles.removedWash} />
          <Bar width="58%" />
        </div>
        <div class={styles.added}>
          <i class={styles.addedWash} />
          <Bar width="78%" />
        </div>
        <Bar width="34%" />
      </Match>
      <Match when={props.id === 'redact'}>
        <Bar width="64%" />
        <div class={styles.warned}>
          <i class={styles.warnedWash} />
          <span class={styles.dots}>
            <For each={[0, 1, 2, 3, 4]}>{() => <i />}</For>
          </span>
        </div>
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
        <div class={styles.thumbRow}>
          <Tile />
          <Tile tone={1} />
          <Tile tone={2} />
        </div>
      </Match>
      <Match when={props.id === 'alt'}>
        <div class={cx(styles.thumbRow, styles.thumbCentre)}>
          <Tile />
          <span class={styles.altSymbol}>{t('whatsNew.illustration.alt')}</span>
        </div>
      </Match>
      <Match when={props.id === 'cli'}>
        <div class={styles.prompt}>
          $ <b />
        </div>
        <Bar width="78%" />
        <Bar width="46%" />
      </Match>
      <Match when={props.id === 'signature'}>
        <Tile class={styles.thumbSigned}>
          <span class={styles.thumbPill}>
            <i />
            <b />
          </span>
        </Tile>
      </Match>
      <Match when={props.id === 'window-styles'}>
        <div class={styles.thumbRow}>
          <Tile class={styles.thumbWindow}>
            <div class={styles.win}>
              <div class={styles.thumbLights}>
                <i />
                <i />
                <i />
              </div>
              <i style={{width: '80%'}} />
            </div>
          </Tile>
          <Tile tone={2} class={styles.thumbWindow}>
            <div class={cx(styles.win, styles.shell)}>
              <i class={styles.thumbPrompt} />
              <i style={{width: '70%'}} />
            </div>
          </Tile>
        </div>
      </Match>
      <Match when={props.id === 'command-menu'}>
        <div class={styles.commandSymbol}>⌘ K</div>
        <div class={styles.thumbSelected}>
          <Bar width="75%" />
        </div>
      </Match>
      <Match when={props.id === 'takumi'}>
        <div class={cx(styles.thumbRow, styles.thumbCentre)}>
          <span class={styles.toggle}>
            <i />
          </span>
          <Tile class={styles.thumbOutput} />
        </div>
      </Match>
      <Match when={props.id === 'layouts'}>
        <div class={styles.thumbScreen}>
          <Tile />
          <i />
        </div>
      </Match>
      <Match when={props.id === 'theme-cards'}>
        <div class={styles.thumbThemes}>
          <Tile />
          <div class={styles.orb} />
          <span class={styles.aa}>Aa</span>
        </div>
      </Match>
      <Match when={props.id === 'animate'}>
        <Tile class={styles.thumbPlay}>
          <PlayGlyph />
        </Tile>
        <div class={styles.thumbTimeline}>
          <i style={{flex: 3}} />
          <i style={{flex: 2}} />
          <i style={{flex: 4}} />
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
        <div class={styles.removed}>
          <i class={cx(styles.removedWash, styles.removedWipe)} />
          <Bar width="38%">
            <i class={cx(styles.tint, styles.tintOut[0])} />
          </Bar>
        </div>
        <div class={styles.added}>
          <i class={cx(styles.addedWash, styles.addedWipe)} />
          <Bar width="72%">
            <i class={cx(styles.tint, styles.tintOut[1])} />
          </Bar>
        </div>
        <Bar width="60%" />
        <Bar width="24%" />
      </Match>
      <Match when={props.id === 'redact'}>
        <Bar width="52%" />
        <div class={styles.warned}>
          <i class={cx(styles.warnedWash, styles.warnedWipe)} />
          <div class={styles.secretRow}>
            <Bar width="24%" />
            <span class={styles.secretSlot}>
              <span class={cx(styles.secretText, styles.secretLeaves)}>
                sk_live_9aF3kQ
              </span>
              <span class={styles.dots}>
                <For each={styles.dot}>{dot => <i class={dot} />}</For>
              </span>
            </span>
          </div>
        </div>
        <Bar width="64%" />
        <Bar width="34%" class={styles.aboveChip} />
        <Chip>
          <i class={styles.warnDot} />
          {t('whatsNew.illustration.secretHidden')}
        </Chip>
      </Match>
      <Match when={props.id === 'social'}>
        <div class={styles.sizes}>
          <For each={['16:9', '1:1', '4:5']}>
            {(ratio, index) => (
              <Tile class={styles.arrive[index()]}>
                <span style={{'aspect-ratio': ratio.replace(':', '/')}}>
                  {ratio}
                </span>
              </Tile>
            )}
          </For>
        </div>
      </Match>
      <Match when={props.id === 'tabs'}>
        <div class={cx(styles.tabs, styles.centred)}>
          <For each={['app.tsx', 'api.ts', 'types.ts']}>
            {file => <span>{file}</span>}
          </For>
        </div>
        <div class={cx(styles.tileRow, styles.centred)}>
          <For each={[0, 1, 2]}>
            {tone => <Tile tone={tone} class={styles.drop[tone]} />}
          </For>
        </div>
      </Match>
      <Match when={props.id === 'alt'}>
        <div class={cx(styles.row, styles.altRow, styles.aboveChip)}>
          <Tile class={styles.altTile}>
            <Code lines={['70%', '45%']} />
          </Tile>
          <q class={cx(styles.altCopy, styles.written)}>
            {t('whatsNew.illustration.altDescription')}
          </q>
        </div>
        <Chip>{t('whatsNew.illustration.alt')}</Chip>
      </Match>
      <Match when={props.id === 'cli'}>
        <div class={styles.cli}>
          <div class={styles.terminal}>
            <div class={styles.terminalHead}>
              <i />
              <i />
              <i />
            </div>
            <code class={styles.cliLine}>
              <b>$</b>
              <span class={styles.typed}>
                codeimage snippet.ts
                <i class={cx(styles.typeCover, styles.typing)} />
              </span>
            </code>
            <code class={cx(styles.cliLine, styles.cliDim, styles.cliAnswer)}>
              <b>✓</b>
              snippet.png
            </code>
          </div>
          <Tile class={cx(styles.cliOutput, styles.cliProduced)}>
            <Code />
          </Tile>
        </div>
      </Match>
      <Match when={props.id === 'takumi'}>
        <div class={styles.engine}>
          <div class={styles.engineSwitch}>
            <i class={cx(styles.engineThumb, styles.engineChosen)} />
            <span class={cx(styles.engineOption, styles.engineOn)} data-on="">
              <i />
              Takumi
            </span>
            <span class={cx(styles.engineOption, styles.engineOff)}>
              <i />
              {t('whatsNew.illustration.browser')}
            </span>
          </div>
          <svg
            class={styles.wires}
            viewBox="0 0 44 56"
            preserveAspectRatio="none"
          >
            <path
              class={styles.wireFallback}
              d="M0 41C24 41 20 28 44 28"
              vector-effect="non-scaling-stroke"
            />
            <path
              class={cx(styles.wireActive, styles.wireOn)}
              d="M0 15C24 15 20 28 44 28"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <Tile class={styles.engineOutput}>
            <Code />
          </Tile>
        </div>
      </Match>
      <Match when={props.id === 'signature'}>
        <Tile class={cx(styles.canvas, styles.signed, styles.centred)}>
          <Code lines={['62%', '40%']} />
          <div class={styles.signatures}>
            <span class={cx(styles.minimal, styles.stamp[0])}>@dev</span>
            <span class={cx(styles.pill, styles.stamp[1])}>@dev</span>
            <span class={cx(styles.card, styles.stamp[2])}>
              <i class={styles.avatar} />
              @dev
            </span>
          </div>
        </Tile>
      </Match>
      <Match when={props.id === 'window-styles'}>
        <div class={cx(styles.tileRow, styles.windows, styles.centred)}>
          <Tile class={cx(styles.windowTile, styles.arrive[0])}>
            <Code window lines={['72%', '46%', '60%']}>
              <div class={styles.windowHead}>
                <i />
                <i />
                <i />
                <b />
              </div>
            </Code>
          </Tile>
          <Tile tone={1} class={cx(styles.windowTile, styles.arrive[1])}>
            <Code window lines={[]}>
              <div class={styles.editorHead}>
                <b />
              </div>
              <For each={['64%', '40%', '54%']}>
                {width => (
                  <div class={styles.numbered}>
                    <i />
                    <Bar width={width} />
                  </div>
                )}
              </For>
            </Code>
          </Tile>
          <Tile tone={2} class={cx(styles.windowTile, styles.arrive[2])}>
            <Code window lines={[]} class={styles.shell}>
              <div class={styles.promptLine}>
                <Chevron />
                <Bar width="58%" />
              </div>
              <Bar width="72%" />
              <div class={styles.promptLine}>
                <Chevron />
                <b />
              </div>
            </Code>
          </Tile>
        </div>
      </Match>
      <Match when={props.id === 'command-menu'}>
        <div class={cx(styles.command, styles.centred)}>
          <div class={styles.commandSearch}>
            <Bar width="48%" />
            <span class={styles.key}>⌘ K</span>
          </div>
          <div class={cx(styles.selected, styles.arrive[0])}>
            <span>↗</span>
            {t('whatsNew.illustration.exportImage')}
            <span>↵</span>
          </div>
          <Bar width="56%" />
        </div>
      </Match>
      <Match when={props.id === 'layouts'}>
        <div class={cx(styles.layouts, styles.centred)}>
          <div class={styles.layoutOption}>
            <div class={styles.screen} data-layout="inspector">
              <div class={styles.stageCanvas}>
                <Tile />
              </div>
              <i class={cx(styles.control, styles.docked.inspector)} />
            </div>
            <span>{t('editor.inspector')}</span>
          </div>
          <div class={styles.layoutOption}>
            <div class={styles.screen} data-layout="dock">
              <div class={styles.stageCanvas}>
                <Tile />
              </div>
              <i class={cx(styles.control, styles.docked.dock)} />
            </div>
            <span>{t('editor.dock')}</span>
          </div>
          <div class={styles.layoutOption}>
            <div class={styles.screen} data-layout="studio">
              <i class={cx(styles.control, styles.rail, styles.docked.rail)} />
              <i
                class={cx(styles.control, styles.docked.studio)}
                data-soft=""
              />
              <div class={styles.stageCanvas}>
                <Tile />
              </div>
            </div>
            <span>{t('editor.studio')}</span>
          </div>
        </div>
      </Match>
      <Match when={props.id === 'theme-cards'}>
        <div class={styles.themes}>
          <Tile class={cx(styles.themeTile, styles.arrive[0])}>
            <Code />
          </Tile>
          <div class={cx(styles.orb, styles.arrive[1])} />
          <span class={cx(styles.aa, styles.arrive[2])}>Aa</span>
        </div>
      </Match>
      <Match when={props.id === 'animate'}>
        <div class={styles.animate}>
          <Tile class={styles.preview}>
            <Code lines={[]}>
              <Bar width="62%" />
              <Bar width="44%" class={cx(styles.inserted, styles.insertedIn)} />
              <Bar width="74%" class={styles.pushedDown} />
              <Bar width="36%" class={styles.pushedDown} />
            </Code>
          </Tile>
          <div class={styles.timeline}>
            <div class={styles.steps}>
              <span class={styles.step} style={{flex: 3}}>
                1
              </span>
              <span class={styles.step} style={{flex: 2}} data-current="">
                2
              </span>
              <span class={styles.step} style={{flex: 4}}>
                3
              </span>
              <div class={cx(styles.scrub, styles.scrubbing)}>
                <i />
              </div>
            </div>
            <div class={styles.transport}>
              <PlayGlyph />
              0:02
              <i />
              0:06
            </div>
          </div>
        </div>
      </Match>
    </Switch>
  );
}

function picture(id: ContentHighlightId): Component<IllustrationProps> {
  return props => (
    <IllustrationFrame {...props} id={id}>
      <Show when={props.mode === 'thumb'} fallback={<Drawing id={id} />}>
        <Thumb id={id} />
      </Show>
    </IllustrationFrame>
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
