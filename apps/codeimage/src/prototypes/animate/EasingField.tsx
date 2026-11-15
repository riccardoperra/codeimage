import {
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  TextField,
} from '@codeui/kit';
import type {EasingCurve} from '@core/animation/model';
import {easedProgress} from '@core/animation/timeline';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {createEffect, createSignal, on, Show} from 'solid-js';
import * as styles from './easing.css';
import type {AnimateStore, PresetId, ProtoStep, StepEasing} from './store';
import {
  cssEasing,
  curveOfStep,
  easingLabel,
  formatCurve,
  formatMs,
  parseCurve,
  PRESETS,
} from './store';
import {CurveGlyph} from './Timeline';

export type CurveFeedback = 'static' | 'dot' | 'chip';

const W = 280;
const H = 150;
const PAD = 18;
const x = (value: number) => PAD + value * (W - 2 * PAD);
const y = (value: number) => H - PAD - value * (H - 2 * PAD);

function Graph(props: {curve: EasingCurve; progress?: number}) {
  const path = () => {
    const [x1, y1, x2, y2] = props.curve;
    return `M${x(0)} ${y(0)} C${x(x1)} ${y(y1)} ${x(x2)} ${y(y2)} ${x(1)} ${y(1)}`;
  };
  return (
    <svg
      class={styles.graph}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={`Easing curve ${formatCurve(props.curve)}`}
    >
      <rect
        class="grid"
        x={x(0)}
        y={y(1)}
        width={x(1) - x(0)}
        height={y(0) - y(1)}
        rx="4"
      />
      <path class="reference" d={`M${x(0)} ${y(0)} L${x(1)} ${y(1)}`} />
      <line
        class="arm"
        x1={x(0)}
        y1={y(0)}
        x2={x(props.curve[0])}
        y2={y(props.curve[1])}
      />
      <line
        class="arm"
        x1={x(1)}
        y1={y(1)}
        x2={x(props.curve[2])}
        y2={y(props.curve[3])}
      />
      <path class="curve" d={path()} />
      <circle
        class="point"
        cx={x(props.curve[0])}
        cy={y(props.curve[1])}
        r="3.5"
      />
      <circle
        class="point"
        cx={x(props.curve[2])}
        cy={y(props.curve[3])}
        r="3.5"
      />
      <Show when={props.progress !== undefined}>
        <line
          class="guide"
          x1={x(props.progress!)}
          y1={y(0)}
          x2={x(props.progress!)}
          y2={y(1)}
        />
        <circle
          class="dot"
          cx={x(props.progress!)}
          cy={y(easedProgress(props.curve, props.progress!))}
          r="6"
        />
      </Show>
    </svg>
  );
}

// A token that crosses the track once, on the curve and for the duration
// of the transition, each time the easing changes.
function TokenRun(props: {easing: StepEasing; durationMs: number}) {
  let chip!: HTMLSpanElement;
  let track!: HTMLDivElement;
  const run = () => {
    const distance = track.clientWidth - chip.offsetWidth - 16;
    chip.getAnimations().forEach(animation => animation.cancel());
    chip.animate(
      [{transform: 'translateX(0)'}, {transform: `translateX(${distance}px)`}],
      {
        duration: props.durationMs,
        easing: cssEasing(props.easing),
        fill: 'forwards',
      },
    );
  };
  createEffect(
    on(
      () => cssEasing(props.easing),
      () => requestAnimationFrame(run),
    ),
  );
  return (
    <div class={styles.chipTrack} ref={track} onClick={run} title="Run again">
      <span class={styles.chip} ref={chip}>
        getUser
      </span>
    </div>
  );
}

const ITEMS = [
  ...PRESETS.map(preset => ({label: preset.label, value: preset.id})),
  {label: 'Custom', value: 'custom' as const},
];

/**
 * The easing of one transition: four presets, or a custom cubic-bezier()
 * typed as text. The curve only shows; it is never dragged.
 */
export function EasingField(props: {
  store: AnimateStore;
  step: ProtoStep;
  feedback: CurveFeedback;
}) {
  const [draft, setDraft] = createSignal(
    formatCurve(curveOfStep(props.step.easing)),
  );
  const [error, setError] = createSignal(false);
  const [custom, setCustom] = createSignal(props.step.easing.kind === 'custom');
  const selected = () =>
    custom() || props.step.easing.kind === 'custom'
      ? 'custom'
      : (props.step.easing as {id: PresetId}).id;

  const segment = () =>
    props.store
      .segments()
      .find(s => s.stepId === props.step.id && s.kind === 'transition');
  // Where the playhead is inside this transition, from 0 to 1.
  const progress = () => {
    const s = segment();
    const at = props.store.playhead();
    if (!s || props.store.playback().state === 'editing') return undefined;
    if (at < s.startMs || at > s.startMs + s.durationMs) return undefined;
    return (at - s.startMs) / s.durationMs;
  };

  const onPreset = (value: PresetId | 'custom') => {
    if (value === 'custom') {
      setCustom(true);
      setDraft(formatCurve(curveOfStep(props.step.easing)));
      return;
    }
    setCustom(false);
    setError(false);
    props.store.actions.setEasing(props.step.id, {kind: 'preset', id: value});
    setDraft(formatCurve(curveOfStep({kind: 'preset', id: value})));
  };

  const onCustom = (text: string) => {
    setDraft(text);
    const curve = parseCurve(text);
    setError(curve === null);
    if (curve)
      props.store.actions.setEasing(props.step.id, {kind: 'custom', curve});
  };

  // Plays this transition from a little before it, so the dot runs.
  const playTransition = () => {
    const s = segment();
    if (!s) return;
    props.store.actions.seek(Math.max(0, s.startMs - 150));
    props.store.actions.play();
  };

  return (
    <Popover placement="top">
      <PopoverTrigger
        as={Button}
        size="sm"
        theme="secondary"
        class={styles.trigger}
        aria-label={`Easing: ${easingLabel(props.step.easing)}`}
      >
        <CurveGlyph curve={curveOfStep(props.step.easing)} />
        {easingLabel(props.step.easing)}
      </PopoverTrigger>
      <PopoverContent title="Easing" class={styles.popover}>
        <Graph
          curve={curveOfStep(props.step.easing)}
          progress={props.feedback === 'dot' ? progress() : undefined}
        />
        <Show when={props.feedback === 'dot'}>
          <div class={styles.graphFooter}>
            <span>
              {progress() === undefined
                ? 'The dot follows the playhead'
                : `${Math.round(progress()! * 100)}% of the time`}
            </span>
            <Button size="xs" theme="secondary" onClick={playTransition}>
              Play transition
            </Button>
          </div>
        </Show>
        <Show when={props.feedback === 'chip'}>
          <TokenRun
            easing={props.step.easing}
            durationMs={props.step.transitionMs}
          />
        </Show>
        <SegmentedField
          size="sm"
          adapt
          value={selected()}
          onChange={onPreset}
          items={ITEMS}
        />
        <Show when={selected() === 'custom'}>
          <div class={styles.customRow}>
            <TextField
              size="sm"
              aria-label="Custom cubic-bezier"
              value={draft()}
              onChange={onCustom}
            />
            <span class={styles.hint} data-error={error() ? '' : undefined}>
              {error()
                ? 'Four numbers, x between 0 and 1'
                : 'y is kept between 0 and 1, so nothing overshoots'}
            </span>
          </div>
        </Show>
        <Show when={selected() !== 'custom'}>
          <span class={`${styles.hint} ${styles.code}`}>
            {formatCurve(curveOfStep(props.step.easing))} ·{' '}
            {formatMs(props.step.transitionMs)}
          </span>
        </Show>
      </PopoverContent>
    </Popover>
  );
}
