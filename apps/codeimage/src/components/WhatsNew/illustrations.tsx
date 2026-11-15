import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import type {Component, JSX} from 'solid-js';
import {Show} from 'solid-js';
import type {HighlightId} from '../../state/whats-new';
import * as styles from './whats-new.css';

/**
 * `play` explains the feature once, as a Nudge step or a Showcase card
 * appears. `still` is the picture in a coachmark, the last frame of `play`.
 * `thumb` is the small picture of an archive row, where text would be too
 * small to read, so a picture made of text draws bars instead.
 */
export type IllustrationMode = 'play' | 'still' | 'thumb';

interface IllustrationProps {
  readonly mode?: IllustrationMode;
}

function Frame(props: IllustrationProps & {children: JSX.Element}) {
  return (
    <div
      class={styles.illustration}
      data-mode={props.mode ?? 'still'}
      aria-hidden="true"
    >
      {props.children}
    </div>
  );
}

function CommandIllustration(props: IllustrationProps) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Frame mode={props.mode}>
      <Show
        when={props.mode === 'thumb'}
        fallback={
          <>
            <div class={styles.miniWindow}>
              <div>⌕ {t('editor.searchOptions')}</div>
              <hr />
              <div class={styles.commandList}>
                <div class={styles.commandPick} />
                <div>{t('frame.theme')}: GitHub Dark</div>
                <div>
                  {t('editor.layoutCommand', {value: t('editor.inspector')})}
                </div>
                <div>{t('export.title')}</div>
              </div>
            </div>
            <kbd class={styles.keycap}>⌘ K</kbd>
          </>
        }
      >
        <svg viewBox="0 0 120 76">
          <rect
            class={styles.thumbWindow}
            x="14"
            y="4"
            width="92"
            height="68"
            rx="8"
          />
          <rect
            class={styles.wireFrame}
            x="24"
            y="14"
            width="72"
            height="9"
            rx="4.5"
          />
          <rect
            class={styles.wireCanvas}
            x="20"
            y="40"
            width="80"
            height="12"
            rx="4"
          />
          <rect
            class={styles.wireFrame}
            x="26"
            y="31"
            width="44"
            height="4"
            rx="2"
          />
          <rect
            fill="currentColor"
            x="26"
            y="44"
            width="56"
            height="4"
            rx="2"
          />
          <rect
            class={styles.wireFrame}
            x="26"
            y="57"
            width="36"
            height="4"
            rx="2"
          />
        </svg>
      </Show>
    </Frame>
  );
}

function RedactIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <Show
        when={props.mode === 'thumb'}
        fallback={
          <div class={styles.miniWindow}>
            <div>const client = connect({'{'}</div>
            <div>
              &nbsp;&nbsp;token: '
              <span class={styles.secret}>
                <span class={styles.plain}>sk_live_51</span>
                <span class={`${styles.redacted} ${styles.dots}`}>
                  ••••••••••
                </span>
              </span>
              ',
            </div>
            <div>{'}'});</div>
          </div>
        }
      >
        <svg viewBox="0 0 120 76">
          <rect
            class={styles.thumbWindow}
            x="14"
            y="4"
            width="92"
            height="68"
            rx="8"
          />
          <rect
            class={styles.wireFrame}
            x="24"
            y="18"
            width="60"
            height="5"
            rx="2.5"
          />
          <rect
            class={styles.wireFrame}
            x="32"
            y="36"
            width="20"
            height="5"
            rx="2.5"
          />
          <path
            d="M58 38.5h32"
            stroke="currentColor"
            stroke-width="5"
            stroke-linecap="round"
            stroke-dasharray="0 8"
          />

          <rect
            class={styles.wireFrame}
            x="24"
            y="54"
            width="16"
            height="5"
            rx="2.5"
          />
        </svg>
      </Show>
    </Frame>
  );
}

function TabsIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <svg width="250" height="96" viewBox="0 0 250 96">
        <rect
          class={styles.wireCanvas}
          x="0"
          y="8"
          width="96"
          height="80"
          rx="8"
        />
        <rect fill="currentColor" x="8" y="16" width="24" height="8" rx="3" />
        <rect
          class={styles.wireFrame}
          x="36"
          y="16"
          width="24"
          height="8"
          rx="3"
        />
        <rect
          class={styles.wireFrame}
          x="64"
          y="16"
          width="24"
          height="8"
          rx="3"
        />
        <path
          d="M10 42h56m-56 12h40m-40 12h50"
          stroke="currentColor"
          stroke-width="3"
        />
        <path
          d="M112 48h24m-8-8 8 8-8 8"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <g class={styles.tabOut[0]}>
          <rect
            class={styles.wireCanvas}
            x="154"
            y="4"
            width="96"
            height="24"
            rx="6"
          />
          <rect
            class={styles.wireFrame}
            x="166"
            y="9"
            width="44"
            height="14"
            rx="3"
          />
        </g>
        <g class={styles.tabOut[1]}>
          <rect
            class={styles.wireCanvas}
            x="154"
            y="36"
            width="96"
            height="24"
            rx="6"
          />
          <rect
            class={styles.wireFrame}
            x="166"
            y="41"
            width="44"
            height="14"
            rx="3"
          />
        </g>
        <g class={styles.tabOut[2]}>
          <rect
            class={styles.wireCanvas}
            x="154"
            y="68"
            width="96"
            height="24"
            rx="6"
          />
          <rect
            class={styles.wireFrame}
            x="166"
            y="73"
            width="44"
            height="14"
            rx="3"
          />
        </g>
      </svg>
    </Frame>
  );
}

function TakumiIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <svg viewBox="0 0 250 100">
        <rect
          class={styles.wireCanvas}
          x="10"
          y="16"
          width="110"
          height="68"
          rx="8"
        />
        <Show
          when={props.mode !== 'thumb'}
          fallback={
            <rect
              class={styles.wireFrame}
              x="24"
              y="32"
              width="42"
              height="5"
              rx="2.5"
            />
          }
        >
          <text x="24" y="38" fill="currentColor" font-size="12">
            Takumi
          </text>
        </Show>
        <rect
          class={styles.wireFrame}
          x="24"
          y="52"
          width="54"
          height="5"
          rx="2.5"
        />
        <g class={styles.engineSwitch}>
          <rect
            fill="currentColor"
            x="84"
            y="30"
            width="24"
            height="14"
            rx="7"
          />
          <circle class={styles.thumbWindow} cx="101" cy="37" r="5" />
        </g>
        <path
          class={styles.engineRoute}
          d="M128 50h24m-7-7 7 7-7 7"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <g class={styles.engineImage}>
          <rect
            class={styles.wireCanvas}
            x="164"
            y="16"
            width="76"
            height="68"
            rx="8"
          />
          <rect
            class={styles.wireFrame}
            x="174"
            y="30"
            width="56"
            height="40"
            rx="4"
          />
          <path
            d="M182 42h34m-34 9h24m-24 9h29"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
      </svg>
    </Frame>
  );
}

function LayoutIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <svg width="250" height="90" viewBox="0 0 250 90">
        <rect
          class={styles.wireCanvas}
          x="0"
          y="10"
          width="72"
          height="65"
          rx="6"
        />
        <rect
          class={styles.wireFrame}
          x="12"
          y="26"
          width="32"
          height="30"
          rx="3"
        />
        <rect
          class={styles.dockRight}
          fill="currentColor"
          x="51"
          y="10"
          width="21"
          height="65"
          rx="5"
        />
        <rect
          class={styles.wireCanvas}
          x="89"
          y="10"
          width="72"
          height="65"
          rx="6"
        />
        <rect
          class={styles.wireFrame}
          x="109"
          y="22"
          width="32"
          height="30"
          rx="3"
        />
        <rect
          class={styles.dockBottom}
          fill="currentColor"
          x="99"
          y="61"
          width="52"
          height="8"
          rx="4"
        />
        <rect
          class={styles.wireCanvas}
          x="178"
          y="10"
          width="72"
          height="65"
          rx="6"
        />
        <rect
          class={styles.dockLeft}
          fill="currentColor"
          x="178"
          y="10"
          width="9"
          height="65"
          rx="4"
        />
        <rect
          class={styles.wireFrame}
          x="202"
          y="26"
          width="32"
          height="30"
          rx="3"
        />
      </svg>
    </Frame>
  );
}

function ThemeIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <svg width="240" height="100" viewBox="0 0 240 100">
        <g class={styles.themeStyle[0]}>
          <rect
            class={styles.wireCanvas}
            x="5"
            y="16"
            width="72"
            height="68"
            rx="8"
          />
          <rect
            class={styles.wireFrame}
            x="16"
            y="27"
            width="50"
            height="46"
            rx="5"
          />
          <path
            d="M24 40h30m-30 8h18m-18 8h25"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
        <g class={styles.themeStyle[1]}>
          <circle cx="123" cy="50" r="25" fill="currentColor" opacity=".2" />
          <path
            d="M105 44h25m-25 8h35m-35 8h18"
            stroke="currentColor"
            stroke-width="4"
          />
        </g>
        <text
          class={styles.themeStyle[2]}
          x="178"
          y="62"
          fill="currentColor"
          font-size="34"
          font-family="monospace"
        >
          Aa
        </text>
      </svg>
    </Frame>
  );
}

function SocialIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <svg viewBox="0 0 250 100">
        <g class={styles.themeStyle[0]}>
          <rect
            class={styles.wireCanvas}
            x="10"
            y="14"
            width="72"
            height="72"
            rx="8"
          />
          <rect
            class={styles.wireFrame}
            x="21"
            y="32"
            width="50"
            height="36"
            rx="4"
          />
          <path
            d="M30 44h30m-30 12h20"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
        <g class={styles.themeStyle[1]}>
          <rect
            class={styles.wireCanvas}
            x="96"
            y="4"
            width="50"
            height="92"
            rx="8"
          />
          <rect
            class={styles.wireFrame}
            x="102"
            y="30"
            width="38"
            height="40"
            rx="4"
          />
          <path
            d="M108 44h26m-26 12h18"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
        <g class={styles.themeStyle[2]}>
          <rect
            class={styles.wireCanvas}
            x="160"
            y="26"
            width="80"
            height="48"
            rx="8"
          />
          <rect
            class={styles.wireFrame}
            x="172"
            y="34"
            width="56"
            height="32"
            rx="4"
          />
          <path
            d="M180 44h32m-32 12h20"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
      </svg>
    </Frame>
  );
}

function SignatureIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <svg viewBox="0 0 250 100">
        <rect
          class={styles.wireCanvas}
          x="12"
          y="5"
          width="226"
          height="90"
          rx="8"
        />
        <path class={styles.wireFrame} d="M28 20h112v4H28zm0 12h76v4H28z" />
        <g class={styles.themeStyle[0]}>
          <text x="27" y="73" fill="currentColor" font-size="12">
            @you
          </text>
        </g>
        <g class={styles.themeStyle[1]}>
          <rect
            class={styles.wireFrame}
            x="79"
            y="53"
            width="62"
            height="28"
            rx="14"
          />
          <text x="89" y="72" fill="currentColor" font-size="12">
            @you
          </text>
        </g>
        <g class={styles.themeStyle[2]}>
          <rect
            class={styles.wireFrame}
            x="152"
            y="48"
            width="72"
            height="38"
            rx="6"
          />
          <circle fill="currentColor" cx="165" cy="67" r="7" />
          <path
            d="M178 61h34m-34 10h24"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
      </svg>
    </Frame>
  );
}

function MarksIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <svg viewBox="0 0 250 100">
        <rect
          class={styles.wireCanvas}
          x="30"
          y="4"
          width="190"
          height="92"
          rx="8"
        />
        <g class={styles.themeStyle[0]}>
          <rect
            fill="#45b883"
            opacity=".2"
            x="38"
            y="16"
            width="174"
            height="18"
            rx="3"
          />
          <path
            d="M48 25h10m-5-5v10m16-5h95"
            stroke="#45b883"
            stroke-width="3"
          />
        </g>
        <g class={styles.themeStyle[1]}>
          <rect
            fill="#f07178"
            opacity=".2"
            x="38"
            y="40"
            width="174"
            height="18"
            rx="3"
          />
          <path d="M48 49h10m11 0h65" stroke="#f07178" stroke-width="3" />
        </g>
        <g class={styles.themeStyle[2]}>
          <rect
            class={styles.wireFrame}
            x="38"
            y="64"
            width="174"
            height="18"
            rx="3"
          />
          <path d="M48 69v8m21-4h110" stroke="currentColor" stroke-width="3" />
        </g>
      </svg>
    </Frame>
  );
}

function AltIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <svg viewBox="0 0 250 100">
        <rect
          class={styles.wireCanvas}
          x="15"
          y="18"
          width="90"
          height="64"
          rx="8"
        />
        <path
          d="M28 36h54m-54 12h34m-34 12h45"
          stroke="currentColor"
          stroke-width="3"
        />
        <path
          d="M115 50h22m-7-7 7 7-7 7"
          fill="none"
          stroke="currentColor"
          stroke-width="3"
        />
        <g class={styles.themeStyle[1]}>
          <rect
            class={styles.wireCanvas}
            x="151"
            y="10"
            width="84"
            height="80"
            rx="8"
          />
          <rect
            class={styles.wireFrame}
            x="173"
            y="5"
            width="40"
            height="14"
            rx="5"
          />
          <path
            d="M164 34h56m-56 12h44m-44 12h56m-56 12h30"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
      </svg>
    </Frame>
  );
}

function WindowStylesIllustration(props: IllustrationProps) {
  return (
    <Frame mode={props.mode}>
      <svg viewBox="0 0 250 100">
        <g class={styles.themeStyle[0]}>
          <rect
            class={styles.wireCanvas}
            x="6"
            y="19"
            width="72"
            height="62"
            rx="10"
          />
          <circle fill="currentColor" cx="19" cy="31" r="3" />
          <circle fill="currentColor" cx="29" cy="31" r="3" />
          <path
            d="M18 49h44m-44 12h28"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
        <g class={styles.themeStyle[1]}>
          <rect
            class={styles.wireCanvas}
            x="89"
            y="19"
            width="72"
            height="62"
            rx="4"
          />
          <rect
            class={styles.wireFrame}
            x="89"
            y="19"
            width="72"
            height="18"
            rx="4"
          />
          <path
            d="M99 49h44m-44 12h28"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
        <g class={styles.themeStyle[2]}>
          <rect
            class={styles.wireCanvas}
            x="172"
            y="19"
            width="72"
            height="62"
            rx="4"
          />
          <path
            d="m183 37 8 6-8 6m14 0h14m-28 14h42"
            fill="none"
            stroke="currentColor"
            stroke-width="3"
          />
        </g>
      </svg>
    </Frame>
  );
}

export const illustrations: Record<
  HighlightId,
  Component<IllustrationProps>
> = {
  social: SocialIllustration,
  signature: SignatureIllustration,
  marks: MarksIllustration,
  alt: AltIllustration,
  'window-styles': WindowStylesIllustration,
  redact: RedactIllustration,
  tabs: TabsIllustration,
  'command-menu': CommandIllustration,
  takumi: TakumiIllustration,
  layouts: LayoutIllustration,
  'theme-cards': ThemeIllustration,
};
