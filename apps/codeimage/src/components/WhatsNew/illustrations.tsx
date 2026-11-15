import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import type {Component, JSX} from 'solid-js';
import {
  For,
  Match,
  Switch,
  createSignal,
  onCleanup,
  onMount,
  Show,
} from 'solid-js';
import type {ContentHighlightId} from '../../state/whats-new/registry';
import * as styles from './illustrations.css';

/** Play explains once on viewport entry. Still and thumb draw the final state. */
export type IllustrationMode = 'play' | 'still' | 'thumb';
interface IllustrationProps {
  readonly mode?: IllustrationMode;
}

function Frame(props: IllustrationProps & {children: JSX.Element}) {
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
      data-mode={props.mode ?? 'still'}
      data-playing={playing() ? '' : undefined}
      aria-hidden="true"
    >
      {props.children}
    </div>
  );
}

function Canvas(props: {thumb: boolean; children: JSX.Element}) {
  return (
    <svg
      width={props.thumb ? 64 : 280}
      height={props.thumb ? 44 : 120}
      viewBox={props.thumb ? '0 0 64 44' : '0 0 280 120'}
      fill="none"
    >
      {props.children}
    </svg>
  );
}

/** Filled geometry uses integer edges; two-pixel strokes sit on integer centres. */
function Window(props: {
  x: number;
  y: number;
  w: number;
  h: number;
  terminal?: boolean;
  children?: JSX.Element;
}) {
  return (
    <g>
      <rect
        class={styles.window}
        x={props.x}
        y={props.y}
        width={props.w}
        height={props.h}
        rx="6"
      />
      <path class={styles.edge} d={`M${props.x} ${props.y + 20}h${props.w}`} />
      <Show
        when={!props.terminal}
        fallback={
          <text class={styles.label} x={props.x + 10} y={props.y + 14}>
            ~/codeimage
          </text>
        }
      >
        <circle class={styles.red} cx={props.x + 10} cy={props.y + 10} r="2" />
        <circle
          class={styles.amber}
          cx={props.x + 18}
          cy={props.y + 10}
          r="2"
        />
        <circle
          class={styles.green}
          cx={props.x + 26}
          cy={props.y + 10}
          r="2"
        />
      </Show>
      {props.children}
    </g>
  );
}

function Code(props: {x: number; y: number; small?: boolean}) {
  return (
    <g transform={`translate(${props.x} ${props.y})`}>
      <Show
        when={!props.small}
        fallback={
          <>
            <path class={styles.keywordStroke} d="M0 0h12m-6 8h16" />
            <path class={styles.stringStroke} d="M16 0h12m-2 8h10" />
            <path class={styles.inkStroke} d="M0 16h18" />
          </>
        }
      >
        <text class={styles.code} y="0">
          <tspan class={styles.keyword}>const </tspan>
          <tspan class={styles.ink}>hello = </tspan>
          <tspan class={styles.string}>'world'</tspan>
          <tspan class={styles.ink}>;</tspan>
        </text>
        <text class={styles.code} y="16">
          <tspan class={styles.keyword}>return </tspan>
          <tspan class={styles.functionColor}>render</tspan>
          <tspan class={styles.ink}>(hello);</tspan>
        </text>
        <text class={styles.code} y="32">
          <tspan class={styles.comment}>// made with codeimage</tspan>
        </text>
      </Show>
    </g>
  );
}

function Thumb(props: {id: ContentHighlightId}) {
  const box = (
    <rect class={styles.window} x="4" y="5" width="56" height="34" rx="6" />
  );
  return (
    <Switch>
      <Match when={props.id === 'animate'}>
        {box}
        <path class={styles.keywordStroke} d="M10 13h20m-14 8h28" />
        <rect class={styles.wash} x="8" y="28" width="48" height="7" rx="3" />
        <path class={styles.accentStroke} d="M36 26v12" />
        <path class={styles.inkStroke} d="m47 10 6 4-6 4z" />
      </Match>
      <Match when={props.id === 'cli'}>
        {box}
        <path class={styles.edge} d="M5 14h54" />
        <path class={styles.greenStroke} d="m11 22 4 4-4 4" />
        <path class={styles.keywordStroke} d="M21 26h31m-31 7h17" />
      </Match>
      <Match when={props.id === 'marks'}>
        <>
          {box}
          <rect class={styles.removed} x="5" y="12" width="54" height="8" />
          <rect class={styles.added} x="5" y="22" width="54" height="8" />
          <path class={styles.redStroke} d="M9 16h6" />
          <path class={styles.greenStroke} d="M9 26h6m-3-3v6" />
          <path class={styles.inkStroke} d="M21 16h22m-22 10h30" />
        </>
      </Match>
      <Match when={props.id === 'redact'}>
        <>
          {box}
          <path class={styles.keywordStroke} d="M10 13h22m-22 19h8" />
          <path class={styles.inkStroke} d="M14 23h8" />
          <g class={styles.string}>
            <For each={[29, 35, 41, 47, 53]}>
              {x => <circle cx={x} cy="23" r="2" />}
            </For>
          </g>
        </>
      </Match>
      <Match when={props.id === 'social'}>
        <>
          <rect
            class={styles.wash}
            x="2"
            y="13"
            width="22"
            height="22"
            rx="3"
          />
          <rect
            class={styles.wash}
            x="28"
            y="5"
            width="16"
            height="20"
            rx="3"
          />
          <rect
            class={styles.wash}
            x="28"
            y="25"
            width="32"
            height="18"
            rx="3"
          />
          <path
            class={styles.keywordStroke}
            d="M7 22h12m-8 5h8m14-15h6m-6 5h6m-6 20h20"
          />
        </>
      </Match>
      <Match when={props.id === 'tabs'}>
        <>
          <rect
            class={styles.window}
            x="2"
            y="3"
            width="60"
            height="10"
            rx="3"
          />
          <path class={styles.keywordStroke} d="M8 8h10m9 0h10m9 0h10" />
          <For each={[3, 24, 45]}>
            {x => (
              <g>
                <rect
                  class={styles.wash}
                  x={x}
                  y="19"
                  width="16"
                  height="22"
                  rx="3"
                />
                <path class={styles.inkStroke} d={`M${x + 4} 26h8m-8 6h6`} />
              </g>
            )}
          </For>
        </>
      </Match>
      <Match when={props.id === 'signature'}>
        <>
          <text class={styles.ink} x="4" y="12" font-size="10">
            @you
          </text>
          <rect
            class={styles.wash}
            x="24"
            y="4"
            width="36"
            height="14"
            rx="7"
          />
          <text class={styles.ink} x="28" y="14" font-size="9">
            @you
          </text>
          <rect
            class={styles.window}
            x="5"
            y="23"
            width="54"
            height="20"
            rx="5"
          />
          <circle class={styles.accent} cx="15" cy="33" r="6" />
          <path class={styles.inkStroke} d="M26 30h25m-25 6h17" />
        </>
      </Match>
      <Match when={props.id === 'window-styles'}>
        <>
          <rect
            class={styles.window}
            x="2"
            y="5"
            width="28"
            height="32"
            rx="5"
          />
          <path class={styles.edge} d="M2 15h28" />
          <circle class={styles.red} cx="8" cy="10" r="2" />
          <circle class={styles.green} cx="15" cy="10" r="2" />
          <rect
            class={styles.window}
            x="34"
            y="10"
            width="28"
            height="32"
            rx="5"
          />
          <path class={styles.inkStroke} d="m40 19 4 4-4 4m8 0h7" />
          <path class={styles.keywordStroke} d="M8 23h15m-15 7h9" />
        </>
      </Match>
      <Match when={props.id === 'alt'}>
        <>
          {box}
          <text
            class={styles.ink}
            x="12"
            y="22"
            font-size="15"
            font-weight="600"
          >
            ALT
          </text>
          <path class={styles.greenStroke} d="m40 27 5 5 10-13" />
        </>
      </Match>
      <Match when={props.id === 'command-menu'}>
        <>
          {box}
          <path class={styles.edge} d="M5 17h54" />
          <text class={styles.ink} x="12" y="15" font-size="10">
            ⌘ K
          </text>
          <rect
            class={styles.wash}
            x="8"
            y="21"
            width="48"
            height="12"
            rx="3"
          />
          <path class={styles.keywordStroke} d="M14 27h30" />
        </>
      </Match>
      <Match when={props.id === 'takumi'}>
        <>
          {box}
          <rect
            class={styles.accent}
            x="12"
            y="14"
            width="40"
            height="18"
            rx="9"
          />
          <circle class={styles.knob} cx="43" cy="23" r="6" />
        </>
      </Match>
      <Match when={props.id === 'layouts'}>
        <>
          {box}
          <rect
            class={styles.wash}
            x="20"
            y="11"
            width="24"
            height="18"
            rx="3"
          />
          <rect
            class={styles.accent}
            x="12"
            y="32"
            width="40"
            height="4"
            rx="2"
          />
          <path class={styles.keywordStroke} d="M25 17h14m-14 6h9" />
        </>
      </Match>
      <Match when={props.id === 'theme-cards'}>
        <>
          <rect
            class={styles.window}
            x="3"
            y="7"
            width="25"
            height="29"
            rx="4"
          />
          <path class={styles.keywordStroke} d="M8 17h14m-14 7h9" />
          <circle class={styles.wash} cx="46" cy="15" r="10" />
          <text class={styles.ink} x="34" y="39" font-size="15">
            Aa
          </text>
        </>
      </Match>
    </Switch>
  );
}

function Picture(
  props: IllustrationProps & {id: ContentHighlightId; children: JSX.Element},
) {
  const thumb = () => props.mode === 'thumb';
  return (
    <Frame mode={props.mode}>
      <Canvas thumb={thumb()}>
        <Show when={thumb()} fallback={props.children}>
          <Thumb id={props.id} />
        </Show>
      </Canvas>
    </Frame>
  );
}

function MarksIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="marks">
      <Window x={20} y={6} w={240} h={108}>
        <text class={styles.label} x="58" y="20">
          greeting.ts
        </text>
        <text class={styles.code} x="34" y="47">
          <tspan class={styles.keyword}>function </tspan>
          <tspan class={styles.functionColor}>greet</tspan>
          <tspan class={styles.ink}>() {'{'}</tspan>
        </text>
        <g class={styles.markLine}>
          <rect class={styles.removed} x="21" y="53" width="238" height="18" />
          <rect class={styles.added} x="21" y="73" width="238" height="18" />
          <path class={styles.redStroke} d="M28 62h6" />
          <path class={styles.greenStroke} d="M28 82h6m-3-3v6" />
        </g>
        <text class={styles.code} x="42" y="66">
          <tspan class={styles.keyword}>return </tspan>
          <tspan class={styles.string}>'hello';</tspan>
        </text>
        <text class={styles.code} x="42" y="86">
          <tspan class={styles.keyword}>return </tspan>
          <tspan class={styles.string}>'hello, world';</tspan>
        </text>
        <text class={styles.code} x="34" y="105">
          {'}'}
        </text>
      </Window>
    </Picture>
  );
}
function RedactIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="redact">
      <Window x={16} y={8} w={248} h={104}>
        <text class={styles.label} x="55" y="22">
          client.ts
        </text>
        <text class={styles.code} x="30" y="50">
          <tspan class={styles.keyword}>const </tspan>
          <tspan class={styles.ink}>client = </tspan>
          <tspan class={styles.functionColor}>connect</tspan>
          <tspan class={styles.ink}>({'{'}</tspan>
        </text>
        <text class={styles.code} x="42" y="70">
          token: '
        </text>
        <text
          class={`${styles.code} ${styles.string} ${styles.before}`}
          x="91"
          y="70"
        >
          sk_live_51demo
        </text>
        <text
          class={`${styles.code} ${styles.string} ${styles.replacement}`}
          x="91"
          y="70"
        >
          ••••••••••••••
        </text>
        <text class={styles.code} x="30" y="90">
          {'}'});
        </text>
      </Window>
    </Picture>
  );
}
function TabsIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="tabs">
      <Window x={8} y={12} w={124} h={96}>
        <text class={styles.label} x="44" y="26">
          index.ts
        </text>
        <path class={styles.edge} d="M70 12v20m30-20v20" />
        <Code x={20} y={50} small />
        <path class={styles.accentStroke} d="M140 60h18m-6-6 6 6-6 6" />
        <g class={styles.split}>
          <For each={[0, 1, 2]}>
            {i => (
              <g transform={`translate(${172 + i * 29} ${12 + i * 24})`}>
                <rect class={styles.wash} width="48" height="46" rx="6" />
                <rect
                  class={styles.window}
                  x="5"
                  y="7"
                  width="38"
                  height="32"
                  rx="4"
                />
                <Code x={10} y={17} small />
              </g>
            )}
          </For>
        </g>
      </Window>
    </Picture>
  );
}
function SocialIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="social">
      <g>
        <rect class={styles.wash} x="10" y="20" width="76" height="76" rx="6" />
        <Window x={20} y={36} w={56} h={44}>
          <Code x={28} y={65} small />
        </Window>
        <text class={styles.label} x="37" y="111">
          1:1
        </text>
      </g>
      <g class={styles.move}>
        <rect class={styles.wash} x="102" y="8" width="64" height="80" rx="6" />
        <Window x={110} y={30} w={48} h={44}>
          <Code x={116} y={59} small />
        </Window>
        <text class={styles.label} x="122" y="104">
          4:5
        </text>
      </g>
      <g>
        <rect
          class={styles.wash}
          x="182"
          y="34"
          width="88"
          height="50"
          rx="6"
        />
        <Window x={194} y={38} w={64} h={42}>
          <Code x={204} y={67} small />
        </Window>
        <text class={styles.label} x="211" y="103">
          16:9
        </text>
      </g>
    </Picture>
  );
}
function SignatureIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="signature">
      <rect class={styles.wash} x="8" y="8" width="264" height="104" rx="6" />
      <Window x={24} y={18} w={232} h={48}>
        <Code x={36} y={48} small />
      </Window>
      <g class={styles.move}>
        <text class={styles.ink} x="22" y="95" font-size="12" font-weight="600">
          @you
        </text>
        <rect
          class={styles.glass}
          x="80"
          y="78"
          width="64"
          height="26"
          rx="13"
        />
        <text class={styles.ink} x="93" y="95" font-size="12" font-weight="500">
          @you
        </text>
        <rect
          class={styles.glass}
          x="158"
          y="72"
          width="100"
          height="34"
          rx="6"
        />
        <circle class={styles.accent} cx="176" cy="89" r="10" />
        <text class={styles.knob} x="169" y="92" font-size="9">
          Y
        </text>
        <text
          class={styles.ink}
          x="192"
          y="85"
          font-size="11"
          font-weight="600"
        >
          You
        </text>
        <text class={styles.label} x="192" y="99">
          @you
        </text>
      </g>
    </Picture>
  );
}
function WindowStylesIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="window-styles">
      <rect class={styles.wash} x="4" y="18" width="84" height="84" rx="6" />
      <Window x={10} y={24} w={72} h={70}>
        <Code x={22} y={59} small />
      </Window>
      <Window x={104} y={18} w={72} h={84}>
        <rect class={styles.wash} x="105" y="39" width="70" height="14" />
        <text class={styles.label} x="112" y="49">
          index.ts
        </text>
        <Code x={114} y={68} small />
      </Window>
      <g class={styles.move}>
        <Window x={192} y={18} w={84} h={84} terminal>
          <text class={styles.code} x="202" y="58">
            <tspan class={styles.string}>❯ </tspan>
            <tspan class={styles.ink}>hello</tspan>
          </text>
          <Code x={204} y={76} small />
        </Window>
      </g>
    </Picture>
  );
}
function AltIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="alt">
      <rect class={styles.wash} x="12" y="23" width="104" height="74" rx="6" />
      <Window x={22} y={32} w={84} h={56}>
        <Code x={34} y={64} small />
      </Window>
      <path class={styles.accentStroke} d="M124 60h22m-6-6 6 6-6 6" />
      <g class={styles.move}>
        <rect
          class={styles.window}
          x="160"
          y="12"
          width="106"
          height="96"
          rx="6"
        />
        <rect
          class={styles.glass}
          x="190"
          y="7"
          width="46"
          height="12"
          rx="4"
        />
        <text
          class={styles.ink}
          x="174"
          y="40"
          font-size="12"
          font-weight="600"
        >
          ALT
        </text>
        <text class={styles.label} x="174" y="60">
          TypeScript
        </text>
        <text class={styles.code} x="174" y="77">
          const hello
        </text>
        <text class={styles.code} x="174" y="91">
          = 'world';
        </text>
      </g>
    </Picture>
  );
}
function CommandIllustration(props: IllustrationProps) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Picture {...props} id="command-menu">
      <rect
        class={styles.window}
        x="24"
        y="8"
        width="232"
        height="104"
        rx="6"
      />
      <text class={styles.label} x="36" y="26">
        ⌕ {t('editor.searchOptions')}
      </text>
      <path class={styles.edge} d="M24 36h232" />
      <text class={styles.label} x="38" y="54">
        ◐ {t('frame.theme')}
      </text>
      <g class={styles.move}>
        <rect
          class={styles.wash}
          x="30"
          y="61"
          width="220"
          height="20"
          rx="4"
        />
      </g>
      <text class={styles.ink} x="38" y="75" font-size="10">
        ↓ {t('export.title')}
      </text>
      <text class={styles.label} x="38" y="99">
        ⌘ K
      </text>
    </Picture>
  );
}
function TakumiIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="takumi">
      <rect
        class={styles.window}
        x="10"
        y="22"
        width="126"
        height="76"
        rx="6"
      />
      <text class={styles.ink} x="22" y="48" font-size="13" font-weight="600">
        Takumi
      </text>
      <rect class={styles.accent} x="92" y="35" width="32" height="18" rx="9" />
      <circle
        class={`${styles.knob} ${styles.switchOn}`}
        cx="115"
        cy="44"
        r="6"
      />
      <path class={styles.edge} d="M22 66h100m-100 14h68" />
      <path class={styles.accentStroke} d="M146 60h20m-6-6 6 6-6 6" />
      <rect class={styles.wash} x="180" y="20" width="90" height="80" rx="6" />
      <Window x={188} y={30} w={74} h={60}>
        <Code x={198} y={64} small />
      </Window>
    </Picture>
  );
}
function LayoutIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="layouts">
      <For each={[10, 100, 190]}>
        {(x, i) => (
          <g>
            <rect
              class={styles.window}
              x={x}
              y="16"
              width="80"
              height="88"
              rx="6"
            />
            <rect
              class={styles.wash}
              x={x + 14}
              y="36"
              width="45"
              height="38"
              rx="4"
            />
            <Code x={x + 18} y={47} small />
            <g class={i() === 1 ? styles.move : undefined}>
              <Show
                when={i() !== 1}
                fallback={
                  <>
                    <rect
                      class={styles.glass}
                      x={x + 10}
                      y="84"
                      width="60"
                      height="12"
                      rx="6"
                    />
                    <For each={[20, 32, 44, 56]}>
                      {k => (
                        <circle
                          class={styles.accent}
                          cx={x + k}
                          cy="90"
                          r="2"
                        />
                      )}
                    </For>
                  </>
                }
              >
                <rect
                  class={styles.glass}
                  x={i() === 0 ? x + 61 : x + 2}
                  y="18"
                  width={i() === 0 ? 17 : 10}
                  height="84"
                  rx="4"
                />
              </Show>
            </g>
          </g>
        )}
      </For>
    </Picture>
  );
}
function ThemeIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="theme-cards">
      <rect class={styles.window} x="12" y="24" width="76" height="72" rx="6" />
      <path class={styles.edge} d="M12 42h76" />
      <circle class={styles.red} cx="22" cy="33" r="2" />
      <circle class={styles.green} cx="30" cy="33" r="2" />
      <Code x={25} y={57} small />
      <g class={styles.move}>
        <circle class={styles.wash} cx="139" cy="59" r="30" />
        <path class={styles.keywordStroke} d="M122 49h24m-24 10h34m-34 10h18" />
      </g>
      <rect
        class={styles.window}
        x="192"
        y="24"
        width="76"
        height="72"
        rx="6"
      />
      <circle class={styles.accent} cx="204" cy="44" r="3" />
      <text class={styles.ink} x="216" y="50" font-size="20">
        Aa
      </text>
      <path class={styles.edge} d="M202 63h52m-52 14h38" />
    </Picture>
  );
}

function AnimateIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="animate">
      <Window x={20} y={4} w={240} h={84}>
        <text class={styles.label} x="58" y="18">
          greeting.ts
        </text>
        <text class={styles.code} x="34" y="44">
          <tspan class={styles.keyword}>const </tspan>
          <tspan class={styles.ink}>hello = </tspan>
          <tspan class={styles.string}>'world';</tspan>
        </text>
        <g class={styles.split}>
          <text class={styles.code} x="34" y="68">
            <tspan class={styles.functionColor}>render</tspan>
            <tspan class={styles.ink}>(hello);</tspan>
          </text>
        </g>
      </Window>
      <path class={styles.accentStroke} d="m24 100 8 5-8 5z" />
      <rect class={styles.glass} x="44" y="96" width="212" height="18" rx="6" />
      <rect class={styles.wash} x="48" y="100" width="64" height="10" rx="3" />
      <rect
        class={styles.wash}
        x="150"
        y="100"
        width="100"
        height="10"
        rx="3"
      />
      <path class={styles.edge} d="M118 100h26" />
      <path
        class={`${styles.accentStroke} ${styles.playhead}`}
        d="M174 93v24"
      />
    </Picture>
  );
}
function CliIllustration(props: IllustrationProps) {
  return (
    <Picture {...props} id="cli">
      <Window x={12} y={14} w={256} h={92} terminal>
        <text class={styles.code} x="26" y="59">
          <tspan class={styles.string}>$ </tspan>
          <tspan class={styles.ink}>codeimage hello.ts -o hello.png</tspan>
        </text>
        <g class={styles.move}>
          <text class={styles.code} x="26" y="83">
            <tspan class={styles.string}>✓ </tspan>
            <tspan class={styles.ink}>hello.png</tspan>
          </text>
        </g>
      </Window>
    </Picture>
  );
}

export const illustrations: Record<
  ContentHighlightId,
  Component<IllustrationProps>
> = {
  animate: AnimateIllustration,
  cli: CliIllustration,
  redact: RedactIllustration,
  tabs: TabsIllustration,
  social: SocialIllustration,
  signature: SignatureIllustration,
  marks: MarksIllustration,
  alt: AltIllustration,
  'window-styles': WindowStylesIllustration,
  'command-menu': CommandIllustration,
  takumi: TakumiIllustration,
  layouts: LayoutIllustration,
  'theme-cards': ThemeIllustration,
};
