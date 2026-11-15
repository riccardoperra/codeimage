import {
  createContainer,
  createVar,
  globalStyle,
  keyframes,
  style,
} from '@vanilla-extract/css';
import {
  curve,
  duration,
  illustrationAt,
  illustrationFor,
  ms,
  reduceMotion,
} from './motion';

/*
 * One drawing language for every picture: a dark panel, 8px code bars,
 * CodeImage canvas gradients as tiles, full-bleed mark rows and small chips.
 *
 * A picture is drawn once and adapts to the panel it is given, from a 213px
 * third of the bento to the full-width card. The panel is a size container;
 * its stage sets the scale every part reads. Every block keeps an even height
 * so that centring never lands on half a pixel.
 */
const panel = createContainer();
/** Height of a code bar; its radius is half of it. */
const barH = createVar();
/** The vertical rhythm between bars. */
const rhythm = createVar();
/** The panel's padding, top and bottom. */
const pad = createVar();
/** The panel's padding at the sides; it grows to cap the drawing's width. */
const inset = createVar();

const ink = '#d6d6dd';
const dim = '#92929b';
const line = '#3a3a40';
const surface = '#1c1c1f';
const raised = '#2c2c31';
const windowFill = '#141416';
const lilac = '#d7a4f5';
const green = '#34c759';
const red = '#ff6259';
const amber = '#ffbd44';
const mono = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
const medium = `${panel} (min-width: 400px)`;
const large = `${panel} (min-width: 640px)`;

// Media deliberately stays dark in both themes, like the exported canvases.
export const frame = style({
  containerName: panel,
  containerType: 'size',
  position: 'relative',
  height: '120px',
  width: '100%',
  minWidth: 0,
  borderRadius: '10px',
  overflow: 'hidden',
  background: '#0f0f10',
  color: ink,
  textAlign: 'left',
  selectors: {
    '&[data-mode="thumb"]': {
      width: '64px',
      height: '44px',
      borderRadius: '6px',
    },
  },
});
export const stage = style({
  vars: {[barH]: '8px', [rhythm]: '8px', [pad]: '16px', [inset]: '16px'},
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: rhythm,
  width: '100%',
  height: '100%',
  padding: `${pad} ${inset}`,
  '@container': {
    [medium]: {vars: {[pad]: '20px', [inset]: '20px'}},
    [large]: {
      vars: {
        [barH]: '10px',
        [rhythm]: '10px',
        [pad]: '24px',
        [inset]: 'max(24px, calc(50cqw - 280px))',
      },
    },
  },
  selectors: {
    // The widest card gives the release's lead picture more room.
    [`${frame}[data-picture="animate"] > &`]: {
      '@container': {
        [large]: {vars: {[inset]: 'max(24px, calc(50cqw - 380px))'}},
      },
    },
    [`${frame}[data-mode="thumb"] > &`]: {
      vars: {[barH]: '4px', [rhythm]: '4px', [pad]: '6px', [inset]: '6px'},
    },
  },
});
globalStyle(`${stage} i, ${stage} b`, {
  display: 'block',
  fontStyle: 'normal',
  fontWeight: 'inherit',
});

export const bar = style({
  display: 'block',
  position: 'relative',
  flexShrink: 0,
  height: barH,
  borderRadius: `calc(${barH} / 2)`,
  background: line,
});

/* ---------- one-shot motion ---------- */

const fade = keyframes({from: {opacity: 0}});
const playing = `${frame}[data-mode="play"][data-playing] &`;
/**
 * A part that explains the feature once. The keyframes only say where the
 * part comes from, so it always ends on the drawing the still mode shows.
 * Reduced motion keeps a fade, or nothing for a part that only moves.
 */
function play(
  from: Parameters<typeof keyframes>[0]['from'],
  options: {
    length: number;
    at?: number;
    easing?: string;
    reduced?: 'fade' | 'none';
  },
) {
  const {length, at = 0, easing = curve.out, reduced = 'fade'} = options;
  const start = `calc(var(--whats-new-play-at, ${ms(duration.playAt)}) + ${ms(at)})`;
  return style({
    selectors: {
      [playing]: {
        animation: `${keyframes({from})} ${ms(length)} ${easing} ${start} both`,
      },
    },
    '@media': {
      [reduceMotion]: {
        selectors: {
          [playing]:
            reduced === 'fade'
              ? {animationName: fade, animationDelay: '0ms'}
              : {animation: 'none'},
        },
      },
    },
  });
}
const staggered = (from: Parameters<typeof play>[0], length: number) =>
  illustrationAt.stagger.map(at => play(from, {length, at}));
globalStyle(`[data-instant] ${frame} *`, {animation: 'none !important'});

/** Three parts taking their place one after the other. */
export const arrive = staggered(
  {opacity: 0, transform: 'translateY(6px)'},
  illustrationFor.arrive,
);

/* ---------- shared parts ---------- */

export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: 0,
});
export const chip = style({
  position: 'absolute',
  right: '10px',
  bottom: '10px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 7px',
  borderRadius: '6px',
  background: 'rgba(255,255,255,.1)',
  color: ink,
  fontSize: '10px',
  fontWeight: 600,
  lineHeight: '14px',
  whiteSpace: 'nowrap',
});
export const tile = style({
  position: 'relative',
  display: 'flex',
  boxSizing: 'border-box',
  minWidth: 0,
  borderRadius: '6px',
  background: 'linear-gradient(135deg,#e2976b,#7a2ff0)',
  selectors: {
    '&[data-tone="1"]': {background: 'linear-gradient(135deg,#3aa0ff,#1463ff)'},
    '&[data-tone="2"]': {background: 'linear-gradient(135deg,#ff5fa2,#ff9f43)'},
    [`${frame}[data-mode="thumb"] &`]: {borderRadius: '3px'},
  },
});
/** Code on a canvas: the bars sit on the gradient itself. */
export const code = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: rhythm,
  flex: 1,
  minWidth: 0,
  minHeight: 0,
});
globalStyle(`${tile} ${bar}`, {background: 'rgb(18 12 28 / .5)'});
/** A canvas that fills what the panel leaves. */
export const canvas = style({
  flex: 1,
  minHeight: 0,
  padding: '12px',
  '@container': {[medium]: {padding: '14px'}},
});

/** Keeps a drawing from stretching across the widest panel. */
export const centred = style({
  width: '100%',
  maxWidth: '440px',
  alignSelf: 'center',
});

/* ---------- line marks ---------- */

const wipe = (at: number) =>
  play(
    {opacity: 0, transform: 'scaleX(.02)'},
    {length: illustrationFor.wipe, at, easing: curve.inOut},
  );
const mark = (color: string, wash: string, at: number) => {
  const line = style({
    position: 'relative',
    margin: `calc(${rhythm} / -2) calc(-1 * ${inset})`,
    padding: `calc(${rhythm} / 2) ${inset}`,
  });
  globalStyle(`${line} > ${bar}`, {background: color});
  return [
    line,
    style({
      position: 'absolute',
      inset: 0,
      background: wash,
      boxShadow: `inset 3px 0 ${color}`,
      transformOrigin: 'left',
      selectors: {
        [`${frame}[data-mode="thumb"] &`]: {boxShadow: `inset 2px 0 ${color}`},
      },
    }),
    wipe(at),
  ] as const;
};
export const [removed, removedWash, removedWipe] = mark(
  red,
  'rgba(255,98,89,.17)',
  0,
);
export const [added, addedWash, addedWipe] = mark(
  green,
  'rgba(52,199,89,.17)',
  illustrationAt.markAdded,
);
export const [warned, warnedWash, warnedWipe] = mark(
  amber,
  'rgba(255,189,68,.14)',
  0,
);
/** The mark's colour takes the bar once the wash has reached it. */
export const tint = style({
  position: 'absolute',
  inset: 0,
  borderRadius: 'inherit',
  background: line,
  opacity: 0,
});
export const tintOut = [0, illustrationAt.markAdded].map(at =>
  play(
    {opacity: 1},
    {length: illustrationFor.wipe, at, easing: curve.inOut, reduced: 'none'},
  ),
);

/* ---------- hide secrets ---------- */

export const secretRow = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  height: barH,
});
export const secretSlot = style({
  position: 'relative',
  display: 'grid',
  alignItems: 'center',
  flex: 'none',
});
globalStyle(`${secretSlot} > *`, {gridArea: '1 / 1'});
/** What the code said, which only the playing picture shows for a moment. */
export const secretText = style({
  font: `600 11px/14px ${mono}`,
  color: amber,
  whiteSpace: 'nowrap',
  opacity: 0,
});
export const secretLeaves = play(
  {opacity: 1},
  {length: illustrationFor.redact, reduced: 'none'},
);
export const dots = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
});
globalStyle(`${dots} > i`, {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: amber,
});
export const dot = Array.from({length: 8}, (_, index) =>
  play(
    {opacity: 0, transform: 'scale(.5)'},
    {
      length: illustrationFor.redact,
      at: index * illustrationAt.redactDot,
    },
  ),
);
export const warnDot = style({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: amber,
});
/** Room for the chip under the lines, so the two never meet. */
export const aboveChip = style({marginBottom: '16px'});

/* ---------- social sizes ---------- */

export const sizes = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
});
globalStyle(`${sizes} > ${tile}`, {
  height: '56px',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: '14px',
  textShadow: '0 1px 2px rgb(0 0 0 / .28)',
  '@container': {[medium]: {height: '64px'}, [large]: {height: '72px'}},
});

globalStyle(`${sizes} > ${tile} > span`, {
  display: 'grid',
  placeItems: 'center',
  height: '100%',
});

/* ---------- one image per tab ---------- */

/** Each tab sits over the image it becomes. */
export const tabs = style({
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  justifyItems: 'start',
  gap: '6px',
});
globalStyle(`${tabs} span`, {
  padding: '3px 7px',
  borderRadius: '6px',
  background: '#26262a',
  color: '#b0b0b8',
  fontSize: '10px',
  fontWeight: 600,
  lineHeight: '14px',
  whiteSpace: 'nowrap',
});
export const tileRow = style({
  display: 'flex',
  alignItems: 'stretch',
  gap: '6px',
  flex: 1,
  minHeight: 0,
  width: '100%',
});
globalStyle(`${tileRow} > ${tile}`, {flex: 1});
/** Each tab drops out of the strip as its own image. */
export const drop = staggered(
  {opacity: 0, transform: 'translateY(-10px)'},
  illustrationFor.arrive,
);

/* ---------- alt text ---------- */

export const altTile = style({
  width: '72px',
  height: '52px',
  flex: 'none',
  padding: '10px',
  vars: {[barH]: '6px', [rhythm]: '6px'},
});
export const altCopy = style({
  display: '-webkit-box',
  WebkitBoxOrient: 'vertical',
  WebkitLineClamp: 3,
  overflow: 'hidden',
  margin: 0,
  color: '#c7c7cc',
  fontSize: '11px',
  fontWeight: 400,
  lineHeight: '16px',
  quotes: 'none',
});
export const altRow = style({gap: '12px'});
/** The description is written out next to the image it describes. */
export const written = play(
  {opacity: 0, transform: 'translateX(-6px)'},
  {length: illustrationFor.arrive},
);

/* ---------- CLI ---------- */

export const cli = style({
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'center',
  gap: '10px',
  '@container': {[medium]: {gap: '16px'}},
});
export const terminal = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '6px',
  flex: '0 1 auto',
  minWidth: 0,
  padding: '10px 12px',
  borderRadius: '8px',
  background: surface,
  overflow: 'hidden',
  '@container': {[medium]: {padding: '14px 18px', gap: '8px'}},
});
export const terminalHead = style({display: 'flex', gap: '4px'});
globalStyle(`${terminalHead} > i`, {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: line,
});
export const cliLine = style({
  display: 'flex',
  gap: '1ch',
  font: `400 11px/16px ${mono}`,
  whiteSpace: 'nowrap',
});
globalStyle(`${cliLine} > b`, {color: green, fontWeight: 700});
export const cliDim = style({color: dim});
/** The command is uncovered a character at a time. */
export const typed = style({
  position: 'relative',
  overflow: 'hidden',
});
export const typeCover = style({
  position: 'absolute',
  inset: 0,
  background: surface,
  transform: 'translateX(101%)',
});
export const typing = play(
  {transform: 'none'},
  {length: illustrationFor.type, easing: 'steps(20, end)', reduced: 'none'},
);
export const cliOutput = style({
  flex: '1 1 0',
  minWidth: '48px',
  maxWidth: '132px',
  padding: '12px',
  '@container': {[medium]: {maxWidth: '160px', padding: '16px'}},
});
export const cliAnswer = play(
  {opacity: 0},
  {length: illustrationFor.arrive, at: illustrationAt.cliDone},
);
/** The image comes out of the terminal that made it. */
export const cliProduced = play(
  {opacity: 0, transform: 'translateX(-10px) scale(.96)'},
  {length: illustrationFor.arrive, at: illustrationAt.cliDone},
);

/* ---------- Takumi ---------- */

export const engine = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
export const engineSwitch = style({
  position: 'relative',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  flex: 'none',
  padding: '2px',
  borderRadius: '8px',
  background: surface,
});
export const engineOption = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '7px',
  height: '26px',
  padding: '0 12px 0 10px',
  color: '#fff',
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: '14px',
  whiteSpace: 'nowrap',
  // The engine that is not in use is the same label, dimmed.
  selectors: {'&:not([data-on])': {opacity: 0.5}},
  '@container': {
    [medium]: {height: '32px', padding: '0 16px 0 12px', fontSize: '12px'},
  },
});
globalStyle(`${engineOption} > i`, {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: dim,
});
globalStyle(`${engineOption}[data-on] > i`, {background: lilac});
export const engineThumb = style({
  position: 'absolute',
  top: '2px',
  left: '2px',
  right: '2px',
  height: '26px',
  '@container': {[medium]: {height: '32px'}},
  borderRadius: '6px',
  background: '#34343a',
});
/** The selection moves from the browser's renderer up to Takumi. */
export const engineChosen = play(
  {transform: 'translateY(100%)'},
  {length: illustrationFor.engine, easing: curve.inOut, reduced: 'none'},
);
const engineSwap = (from: number) =>
  play(
    {opacity: from},
    {length: illustrationFor.engine, easing: curve.inOut, reduced: 'none'},
  );
export const engineOn = engineSwap(0.5);
export const engineOff = engineSwap(1);
export const wires = style({
  flex: '0 1 44px',
  minWidth: '24px',
  height: '56px',
  '@container': {[medium]: {height: '68px', flex: '0 1 56px'}},
  fill: 'none',
  strokeWidth: 1.5,
  overflow: 'visible',
});
export const wireFallback = style({stroke: '#55555e', strokeDasharray: '2 4'});
export const wireActive = style({stroke: lilac});
export const wireOn = play(
  {opacity: 0},
  {length: illustrationFor.arrive, at: illustrationAt.engineWire},
);
export const engineOutput = style({
  flex: '0 1 150px',
  minWidth: '64px',
  height: '72px',
  padding: '12px',
  '@container': {
    [medium]: {height: '92px', flex: '0 1 190px', padding: '16px'},
  },
});

/* ---------- signatures ---------- */

export const signed = style({
  flexDirection: 'column',
  gap: '6px',
  '@container': {[medium]: {gap: '8px', padding: '10px'}},
});
export const signatures = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '6px',
  flex: 'none',
  height: '22px',
  color: '#fff',
  fontSize: '10px',
  fontWeight: 600,
  lineHeight: '14px',
  whiteSpace: 'nowrap',
});
const signatureSurface = {
  background: 'rgb(20 14 30 / .62)',
  boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / .16)',
};
export const minimal = style({
  padding: '0 2px',
  textShadow: '0 1px 2px rgb(0 0 0 / .3)',
});
export const pill = style({
  ...signatureSurface,
  padding: '3px 9px',
  borderRadius: '10px',
});
export const card = style({
  ...signatureSurface,
  display: 'inline-flex',
  alignItems: 'center',
  gap: '5px',
  padding: '3px 8px 3px 3px',
  borderRadius: '6px',
});
export const avatar = style({
  width: '16px',
  height: '16px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#ff5fa2,#ff9f43)',
  boxShadow: '0 0 0 1px rgb(255 255 255 / .5)',
});
/** Each signature is stamped onto the image. */
export const stamp = staggered(
  {opacity: 0, transform: 'scale(1.14)'},
  illustrationFor.stamp,
);

/* ---------- window styles ---------- */

export const windows = style({
  gap: '6px',
  '@container': {[medium]: {gap: '10px'}},
});
/** The canvas shows on three sides; the window runs off its bottom edge. */
export const windowTile = style({
  padding: '8px 8px 0',
  overflow: 'hidden',
  vars: {[barH]: '6px', [rhythm]: '6px'},
  '@container': {
    [medium]: {
      padding: '12px 12px 0',
      vars: {[barH]: '8px', [rhythm]: '8px'},
    },
  },
});
/** A window is a filled shape, never an outline. */
export const win = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  gap: rhythm,
  flex: 1,
  minWidth: 0,
  padding: '7px',
  borderRadius: '5px 5px 0 0',
  background: windowFill,
  overflow: 'hidden',
  '@container': {[medium]: {padding: '10px'}},
});
globalStyle(`${win} ${bar}`, {background: line});
/** The Card: traffic lights and the file's tab. */
export const windowHead = style({
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  height: barH,
  flex: 'none',
});
globalStyle(`${windowHead} > i`, {
  width: '6px',
  height: '6px',
  flex: 'none',
  borderRadius: '50%',
  background: red,
});
globalStyle(`${windowHead} > i:nth-child(2)`, {background: amber});
globalStyle(`${windowHead} > i:nth-child(3)`, {background: green});
globalStyle(`${windowHead} > b`, {
  flex: '0 1 16px',
  height: barH,
  marginLeft: '3px',
  borderRadius: `calc(${barH} / 2)`,
  background: raised,
});
/** The Editor's flat header: a strip with the open file's tab. */
export const editorHead = style({
  display: 'flex',
  alignItems: 'flex-end',
  flex: 'none',
  height: '12px',
  margin: '-7px -7px 0',
  padding: '0 7px',
  background: raised,
  '@container': {
    [medium]: {height: '16px', margin: '-10px -10px 0', padding: '0 10px'},
  },
});
globalStyle(`${editorHead} > b`, {
  width: '22px',
  height: '8px',
  borderRadius: '3px 3px 0 0',
  background: windowFill,
  '@container': {[medium]: {width: '32px', height: '11px'}},
});
/** A line with its number in the gutter. */
export const numbered = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
});
globalStyle(`${numbered} > i`, {
  width: '3px',
  height: barH,
  flex: 'none',
  borderRadius: '2px',
  background: raised,
});
/** The Terminal has no header, only a prompt. */
export const shell = style({background: '#060607'});
export const promptLine = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  height: barH,
});
globalStyle(`${promptLine} > svg`, {
  width: barH,
  height: barH,
  flex: 'none',
  fill: 'none',
  stroke: green,
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  overflow: 'visible',
});
globalStyle(`${promptLine} > b`, {
  width: '4px',
  height: barH,
  borderRadius: '1px',
  background: ink,
});

/* ---------- command menu ---------- */

export const command = style({
  display: 'flex',
  flexDirection: 'column',
  gap: rhythm,
});
export const commandSearch = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
});
export const key = style({
  padding: '3px 6px',
  borderRadius: '6px',
  background: '#26262a',
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: '14px',
});
export const selected = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 10px',
  borderRadius: '6px',
  background: '#26262a',
  color: ink,
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: '16px',
  whiteSpace: 'nowrap',
});
globalStyle(`${selected} > span:first-child`, {color: lilac});
globalStyle(`${selected} > span:last-child`, {
  marginLeft: 'auto',
  color: dim,
});

/* ---------- layouts ---------- */

export const layouts = style({
  display: 'flex',
  gap: '10px',
  flex: 1,
  minHeight: 0,
  '@container': {[medium]: {gap: '16px'}},
});
export const layoutOption = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  flex: 1,
  minWidth: 0,
  color: '#c7c7cc',
  fontSize: '10px',
  fontWeight: 600,
  lineHeight: '14px',
  whiteSpace: 'nowrap',
  '@container': {[medium]: {fontSize: '11px'}},
});
/** The editor's screen: the canvas in the middle, the controls in the accent. */
export const screen = style({
  position: 'relative',
  boxSizing: 'border-box',
  display: 'grid',
  gap: '3px',
  flex: 1,
  minHeight: 0,
  width: '100%',
  borderRadius: '6px',
  overflow: 'hidden',
  selectors: {
    '&[data-layout="inspector"]': {gridTemplateColumns: '1fr 30%'},
    '&[data-layout="studio"]': {gridTemplateColumns: '6px 26% 1fr'},
  },
});
export const stageCanvas = style({
  boxSizing: 'border-box',
  display: 'flex',
  minWidth: 0,
  padding: '12px 8px',
  borderRadius: '6px',
  background: surface,
  selectors: {
    [`${screen}[data-layout="dock"] > &`]: {padding: '10px 20% 20px'},
  },
  '@container': {
    [medium]: {
      padding: '16px 14px',
      selectors: {
        [`${screen}[data-layout="dock"] > &`]: {padding: '12px 22% 24px'},
      },
    },
  },
});
globalStyle(`${stageCanvas} > ${tile}`, {flex: 1, borderRadius: '3px'});
export const control = style({
  minWidth: 0,
  borderRadius: '6px',
  background: '#b68ad8',
  selectors: {
    '&[data-soft]': {background: 'rgb(182 138 216 / .42)'},
    [`${screen}[data-layout="dock"] > &`]: {
      position: 'absolute',
      left: '20%',
      right: '20%',
      bottom: '6px',
      height: '8px',
      borderRadius: '4px',
    },
  },
});
/** Each layout's controls come in from the edge they live on. */
const dock = (from: string, at: number) =>
  play({opacity: 0, transform: from}, {length: illustrationFor.arrive, at});
const [first, second, third] = illustrationAt.stagger;
export const rail = style({borderRadius: '3px'});
export const docked = {
  inspector: dock('translateX(60%)', first),
  dock: dock('translateY(160%)', second),
  rail: dock('translateX(-160%)', third),
  studio: dock('translateX(-60%)', third),
};

/* ---------- theme cards ---------- */

export const themes = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-evenly',
  gap: '10px',
  width: '100%',
  maxWidth: '300px',
  alignSelf: 'center',
  '@container': {[medium]: {maxWidth: '360px'}},
});
export const themeTile = style({
  width: '64px',
  height: '56px',
  flex: 'none',
  padding: '10px',
  vars: {[barH]: '6px', [rhythm]: '6px'},
  '@container': {
    [medium]: {
      width: '80px',
      height: '64px',
      padding: '12px',
      vars: {[barH]: '8px', [rhythm]: '8px'},
    },
  },
});
export const orb = style({
  width: '48px',
  height: '48px',
  flex: 'none',
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#3aa0ff,#7a2ff0)',
  '@container': {[medium]: {width: '56px', height: '56px'}},
});
export const aa = style({
  color: lilac,
  fontSize: '32px',
  fontWeight: 600,
  lineHeight: '40px',
  '@container': {[medium]: {fontSize: '36px'}},
});

/* ---------- code animations ---------- */

export const animate = style({
  display: 'flex',
  alignItems: 'stretch',
  gap: '12px',
  flex: 1,
  minHeight: 0,
  '@container': {[medium]: {gap: '20px'}, [large]: {gap: '32px'}},
});
export const preview = style({
  flex: '0 0 42%',
  maxWidth: '300px',
  padding: '12px',
  '@container': {[medium]: {padding: '16px'}, [large]: {padding: '20px'}},
});
/** The line the second step adds. */
export const inserted = style({transformOrigin: 'left'});
globalStyle(`${tile} ${inserted}`, {background: '#fff'});
const morph = (from: Parameters<typeof play>[0]) =>
  play(from, {
    length: illustrationFor.morph,
    at: illustrationAt.morph,
    easing: curve.inOut,
    reduced: 'none',
  });
export const insertedIn = morph({opacity: 0, transform: 'scaleX(.6)'});
/** The lines below make room: they start one row higher. */
export const pushedDown = morph({
  transform: `translateY(calc(-1 * (${barH} + ${rhythm})))`,
});
export const timeline = style({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '10px',
  flex: 1,
  minWidth: 0,
  '@container': {[large]: {gap: '14px'}},
});
/** A step is as wide as it holds; the playhead crosses them. */
export const steps = style({
  position: 'relative',
  overflowX: 'clip',
  display: 'flex',
  gap: '4px',
  height: '28px',
  '@container': {[large]: {height: '40px', gap: '6px'}},
});
export const step = style({
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  minWidth: 0,
  padding: '0 7px',
  borderRadius: '6px',
  background: '#26262a',
  color: '#b0b0b8',
  fontSize: '11px',
  fontWeight: 600,
  lineHeight: '14px',
  selectors: {
    '&[data-current]': {background: 'rgb(215 164 245 / .24)', color: '#ecd3fb'},
  },
  '@container': {
    [large]: {padding: '0 12px', fontSize: '13px', borderRadius: '8px'},
  },
});
/** As wide as the steps, so a percentage moves the playhead along them. */
export const scrub = style({
  position: 'absolute',
  inset: '-4px 0',
  transform: 'translateX(48%)',
  pointerEvents: 'none',
});
globalStyle(`${scrub} > i`, {
  width: '2px',
  height: '100%',
  marginLeft: '-1px',
  borderRadius: '1px',
  background: lilac,
});
export const scrubbing = play(
  {transform: 'translateX(0)'},
  {length: illustrationFor.playhead, easing: 'linear', reduced: 'none'},
);
export const transport = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  height: '14px',
  color: dim,
  fontSize: '10px',
  fontWeight: 600,
  lineHeight: '14px',
  fontVariantNumeric: 'tabular-nums',
  '@container': {[large]: {fontSize: '12px', gap: '8px'}},
});
globalStyle(`${transport} > svg`, {
  width: '10px',
  height: '10px',
  flex: 'none',
  fill: lilac,
});
globalStyle(`${transport} > i`, {
  flex: 1,
  height: '2px',
  borderRadius: '1px',
  // Played up to the second step, like the playhead above it.
  background: `linear-gradient(90deg, ${lilac} 0 34%, ${line} 34%)`,
});

/* ---------- thumbnails: symbols drawn for 64×44 ---------- */

globalStyle(`${frame}[data-mode="thumb"] ${dots}`, {gap: '3px'});
globalStyle(`${frame}[data-mode="thumb"] ${dots} > i`, {
  width: '4px',
  height: '4px',
});
export const thumbSizes = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
});
globalStyle(`${thumbSizes} > ${tile}:nth-child(1)`, {
  width: '22px',
  height: '12px',
});
globalStyle(`${thumbSizes} > ${tile}:nth-child(2)`, {
  width: '12px',
  height: '12px',
});
globalStyle(`${thumbSizes} > ${tile}:nth-child(3)`, {
  width: '10px',
  height: '14px',
});
export const thumbTabs = style({display: 'flex', gap: '4px'});
globalStyle(`${thumbTabs} > i`, {
  height: '4px',
  flex: 1,
  borderRadius: '2px',
  background: '#50505a',
});
export const thumbRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  height: '20px',
});
globalStyle(`${thumbRow} > ${tile}`, {flex: 1, alignSelf: 'stretch'});
export const thumbCentre = style({justifyContent: 'center', gap: '6px'});
export const altSymbol = style({
  flex: 'none',
  color: ink,
  fontSize: '10px',
  fontWeight: 700,
  lineHeight: '12px',
});
export const prompt = style({
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  height: '8px',
  color: green,
  font: `700 11px/8px ${mono}`,
});
globalStyle(`${prompt} > b`, {
  width: '4px',
  height: '8px',
  borderRadius: '1px',
  background: ink,
});
export const thumbSigned = style({
  alignItems: 'flex-end',
  justifyContent: 'flex-end',
  height: '32px',
  padding: '4px',
});
export const thumbPill = style({
  display: 'flex',
  alignItems: 'center',
  gap: '3px',
  padding: '2px 5px 2px 2px',
  borderRadius: '6px',
  background: 'rgb(20 14 30 / .7)',
});
globalStyle(`${thumbPill} > i`, {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg,#ff5fa2,#ff9f43)',
});
globalStyle(`${thumbPill} > b`, {
  width: '12px',
  height: '4px',
  borderRadius: '2px',
  background: '#fff',
});
export const thumbWindow = style({
  padding: '3px 3px 0',
  overflow: 'hidden',
});
globalStyle(`${thumbRow}:has(> ${thumbWindow})`, {height: '28px'});
globalStyle(`${thumbWindow} > ${win}`, {
  gap: '3px',
  padding: '3px',
  borderRadius: '3px 3px 0 0',
});
globalStyle(`${thumbWindow} > ${win} > i`, {
  height: '3px',
  borderRadius: '2px',
  background: line,
});
export const thumbLights = style({
  display: 'flex',
  gap: '2px',
  height: '2px',
  flex: 'none',
});
globalStyle(`${thumbLights} > i`, {
  width: '2px',
  height: '2px',
  flex: 'none',
  borderRadius: '50%',
  background: red,
});
globalStyle(`${thumbLights} > i:nth-child(2)`, {background: amber});
globalStyle(`${thumbLights} > i:nth-child(3)`, {background: green});
export const thumbPrompt = style({});
globalStyle(`${thumbWindow} > ${win} > ${thumbPrompt}`, {
  width: '5px',
  background: green,
});
export const commandSymbol = style({
  fontSize: '12px',
  fontWeight: 600,
  lineHeight: '12px',
});
export const thumbSelected = style({
  padding: '4px',
  borderRadius: '3px',
  background: '#26262a',
});
export const toggle = style({
  display: 'flex',
  justifyContent: 'flex-end',
  boxSizing: 'border-box',
  flex: 'none',
  width: '22px',
  height: '12px',
  padding: '2px',
  borderRadius: '6px',
  background: lilac,
});
globalStyle(`${toggle} > i`, {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#1c1024',
});
export const thumbOutput = style({flex: 'none', width: '22px', height: '20px'});
export const thumbScreen = style({
  display: 'grid',
  gridTemplateColumns: '1fr 14px',
  gap: '3px',
  height: '28px',
});
globalStyle(`${thumbScreen} > i`, {borderRadius: '3px', background: '#b68ad8'});
export const thumbThemes = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '5px',
});
globalStyle(`${thumbThemes} > ${tile}`, {width: '12px', height: '18px'});
globalStyle(`${thumbThemes} > ${orb}`, {width: '12px', height: '12px'});
globalStyle(`${thumbThemes} > ${aa}`, {fontSize: '13px', lineHeight: '14px'});
export const thumbPlay = style({
  alignItems: 'center',
  justifyContent: 'center',
  height: '20px',
});
globalStyle(`${thumbPlay} > svg`, {width: '8px', height: '8px', fill: '#fff'});
export const thumbTimeline = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '2px',
  height: '6px',
});
globalStyle(`${thumbTimeline} > i`, {
  height: '4px',
  borderRadius: '2px',
  background: line,
});
globalStyle(`${thumbTimeline} > b`, {
  position: 'absolute',
  left: '48%',
  width: '2px',
  height: '6px',
  borderRadius: '1px',
  background: lilac,
});
