import {globalStyle, keyframes, style} from '@vanilla-extract/css';
import {curve, duration, illustrationFor, ms, reduceMotion} from './motion';

// Media deliberately stays dark in both themes, like the exported canvases.
export const frame = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '7px',
  padding: '16px',
  height: '120px',
  width: '100%',
  minWidth: 0,
  borderRadius: '10px',
  overflow: 'hidden',
  background: '#0f0f10',
  color: '#d6d6dd',
  selectors: {
    '&[data-mode="thumb"]': {
      width: '64px',
      height: '44px',
      padding: '6px',
      gap: '4px',
      borderRadius: '6px',
    },
  },
});
export const bar = style({
  display: 'block',
  flexShrink: 0,
  height: '8px',
  borderRadius: '4px',
  background: '#3a3a40',
  position: 'relative',
});
const mark = {
  display: 'block',
  margin: '-3px -16px',
  padding: '3px 13px',
  borderLeft: '3px solid',
};
export const added = style({
  ...mark,
  background: 'rgba(52,199,89,.17)',
  borderColor: '#34c759',
});
export const removed = style({
  ...mark,
  background: 'rgba(255,98,89,.17)',
  borderColor: '#ff6259',
});
globalStyle(`${added} ${bar}`, {background: '#34c759'});
globalStyle(`${removed} ${bar}`, {background: '#ff6259'});
export const row = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  minWidth: 0,
});
export const secret = style({
  font: '11px ui-monospace, monospace',
  color: '#9ad59a',
  filter: 'blur(4px)',
  whiteSpace: 'nowrap',
});
export const chip = style({
  position: 'absolute',
  right: '10px',
  bottom: '10px',
  fontSize: '10px',
  fontWeight: 600,
  padding: '3px 7px',
  borderRadius: '6px',
  background: 'rgba(255,255,255,.1)',
  color: '#d6d6dd',
});
export const tile = style({
  position: 'relative',
  minWidth: 0,
  borderRadius: '5px',
  background: 'linear-gradient(135deg,#e2976b,#7a2ff0)',
  selectors: {
    '&[data-tone="1"]': {background: 'linear-gradient(135deg,#3aa0ff,#1463ff)'},
    '&[data-tone="2"]': {background: 'linear-gradient(135deg,#ff5fa2,#ff9f43)'},
  },
});
export const sizes = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
});
globalStyle(`${sizes} span`, {
  height: '56px',
  display: 'grid',
  placeItems: 'center',
  color: '#fff',
  fontSize: '10px',
  fontWeight: 600,
  textShadow: '0 1px 3px #352142',
});
export const tabs = style({display: 'flex', gap: '4px'});
globalStyle(`${tabs} span`, {
  fontSize: '10px',
  fontWeight: 600,
  padding: '3px 7px',
  borderRadius: '5px',
  background: '#26262a',
  color: '#b0b0b8',
  whiteSpace: 'nowrap',
});
export const tileRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  width: '100%',
});
globalStyle(`${tileRow} > ${tile}`, {flex: 1, height: '38px'});
export const altTile = style({width: '64px', height: '44px', flex: 'none'});
export const altCopy = style({
  fontSize: '11px',
  lineHeight: 1.45,
  color: '#c7c7cc',
  quotes: 'none',
  margin: 0,
  paddingBottom: '10px',
});
export const cli = style({
  font: '11px/1.5 ui-monospace, monospace',
  whiteSpace: 'pre-wrap',
  overflowWrap: 'anywhere',
});
globalStyle(`${cli} b`, {color: '#34c759'});
export const dim = style({color: '#92929b'});
export const engine = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '16px',
  paddingBottom: '12px',
});
export const engineInput = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
  flex: 1,
  maxWidth: '100px',
});
export const engineArrow = style({
  fontSize: '24px',
  color: '#d7a4f5',
  flex: 'none',
});
export const engineOutput = style({
  width: '112px',
  height: '68px',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
});
globalStyle(`${engineOutput} ${chip}`, {
  right: '6px',
  bottom: '5px',
  fontSize: '10px',
  padding: '1px 5px',
  background: '#1d152b',
});
export const signedTile = style({
  height: '88px',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '7px',
});
export const signatures = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px',
  marginTop: '3px',
  fontSize: '10px',
  fontWeight: 600,
  color: '#fff',
});
globalStyle(`${signatures} > span`, {
  whiteSpace: 'nowrap',
  textShadow: '0 1px 3px #352142',
});
globalStyle(`${signatures} > span:nth-child(2)`, {
  padding: '4px 7px',
  background: '#211727',
  borderRadius: '20px',
});
globalStyle(`${signatures} > span:nth-child(3)`, {
  padding: '4px 7px',
  background: '#211727',
  borderRadius: '5px',
});
export const windowTile = style({
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
});
globalStyle(`${tileRow} > ${windowTile}`, {height: '80px'});
export const traffic = style({
  display: 'flex',
  gap: '4px',
  marginBottom: '4px',
});
globalStyle(`${traffic} i`, {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#ff6259',
});
globalStyle(`${traffic} i:nth-child(2)`, {background: '#ffbd44'});
globalStyle(`${traffic} i:nth-child(3)`, {background: '#34c759'});
export const windowTab = style({
  height: '10px',
  marginBottom: '4px',
  color: '#fff',
  font: '600 10px ui-monospace, monospace',
});
export const command = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '10px',
});
export const commandSearch = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '10px',
});
export const key = style({
  padding: '3px 6px',
  background: '#26262a',
  borderRadius: '5px',
  fontSize: '11px',
  fontWeight: 600,
});
export const selected = style({
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '8px 10px',
  borderRadius: '6px',
  background: '#26262a',
  color: '#d6d6dd',
  fontSize: '11px',
  fontWeight: 600,
});
globalStyle(`${selected} > span:last-child`, {
  marginLeft: 'auto',
  color: '#92929b',
});
export const layouts = style({
  display: 'flex',
  justifyContent: 'center',
  gap: '16px',
  width: '100%',
  maxWidth: '600px',
  alignSelf: 'center',
});
export const layoutOption = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  alignItems: 'center',
  flex: 1,
  minWidth: 0,
  fontSize: '10px',
  fontWeight: 600,
});
export const layoutShape = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'stretch',
  width: '100%',
  height: '64px',
  gap: '5px',
  selectors: {
    '&[data-layout="dock"]': {padding: '0 4px 10px'},
    '&[data-layout="studio"]': {paddingLeft: '8px'},
  },
});
globalStyle(`${layoutShape} > ${tile}`, {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '7px',
  padding: '10px',
});
globalStyle(`${layoutShape} > i`, {
  width: '23%',
  background: '#3a3a40',
  borderRadius: '4px',
});
globalStyle(`${layoutShape}[data-layout="dock"] > i`, {
  position: 'absolute',
  width: '70%',
  height: '14px',
  bottom: 0,
  left: '15%',
  background: '#50505a',
});
globalStyle(`${layoutShape}[data-layout="studio"] > b`, {
  position: 'absolute',
  width: '5px',
  height: '100%',
  left: 0,
  background: '#50505a',
  borderRadius: '4px',
});
export const themes = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',
  gap: '20px',
});
export const themeTile = style({
  width: '72px',
  height: '64px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: '7px',
  padding: '10px',
});
export const orb = style({
  width: '56px',
  height: '56px',
  borderRadius: '50%',
  flex: 'none',
  background: 'linear-gradient(135deg,#3aa0ff,#7a2ff0)',
});
export const aa = style({fontSize: '36px', fontWeight: 600, color: '#d7a4f5'});
export const animationTile = style({
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  gap: '7px',
});
globalStyle(`${tileRow} > ${animationTile}`, {height: '56px'});
export const timeline = style({
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  height: '16px',
  marginTop: '6px',
});
globalStyle(`${timeline} i`, {
  height: '8px',
  flex: 1,
  background: '#3a3a40',
  borderRadius: '4px',
});
globalStyle(`${timeline} b`, {
  position: 'absolute',
  left: '64%',
  width: '3px',
  height: '16px',
  borderRadius: '2px',
  background: '#d7a4f5',
});

const arrive = keyframes({
  from: {opacity: 0, transform: 'translateY(6px)'},
  to: {opacity: 1, transform: 'none'},
});
const fade = keyframes({from: {opacity: 0}, to: {opacity: 1}});
function play(animation: string) {
  return style({
    selectors: {
      [`${frame}[data-mode="play"][data-playing] &`]: {
        animation: `${animation} ${ms(illustrationFor.theme)} ${curve.inOut} var(--whats-new-play-at, ${ms(duration.playAt)}) both`,
      },
    },
    '@media': {
      [reduceMotion]: {
        selectors: {
          [`${frame}[data-mode="play"][data-playing] &`]: {
            animationName: fade,
            animationDelay: '0ms',
          },
        },
      },
    },
  });
}
export const explain = play(arrive);
export const playhead = play(
  keyframes({from: {transform: 'translateX(-60px)'}, to: {transform: 'none'}}),
);
globalStyle(`[data-instant] ${frame} *`, {animation: 'none !important'});

export const secretDots = style({
  color: '#9ad59a',
  font: '12px/8px ui-monospace, monospace',
  letterSpacing: '2px',
});
export const thumbSizes = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
});
globalStyle(`${thumbSizes} > ${tile}:nth-child(1)`, {
  width: '21px',
  height: '12px',
});
globalStyle(`${thumbSizes} > ${tile}:nth-child(2)`, {
  width: '12px',
  height: '12px',
});
globalStyle(`${thumbSizes} > ${tile}:nth-child(3)`, {
  width: '12px',
  height: '15px',
});
export const thumbTabs = style({display: 'flex', gap: '3px'});
globalStyle(`${thumbTabs} i`, {
  height: '4px',
  flex: 1,
  borderRadius: '2px',
  background: '#50505a',
});
export const altSymbol = style({
  fontSize: '10px',
  fontWeight: 600,
  color: '#d6d6dd',
});
export const prompt = style({
  color: '#34c759',
  font: 'bold 16px/1 ui-monospace, monospace',
});
globalStyle(`${prompt} span`, {color: '#92929b'});
export const signatureSymbol = style({
  position: 'absolute',
  right: '5px',
  bottom: '2px',
  color: '#fff',
  fontSize: '17px',
  fontWeight: 600,
});
export const commandSymbol = style({fontSize: '13px', fontWeight: 600});
export const engineSymbol = style({fontSize: '24px', color: '#d7a4f5'});
globalStyle(`${frame}[data-mode="thumb"] ${bar}`, {
  height: '4px',
  borderRadius: '2px',
});
globalStyle(
  `${frame}[data-mode="thumb"] ${added}, ${frame}[data-mode="thumb"] ${removed}`,
  {margin: '-1px -6px', padding: '2px 4px', borderLeftWidth: '2px'},
);
globalStyle(`${frame}[data-mode="thumb"] ${tileRow} > ${tile}`, {
  height: '24px',
  padding: '5px',
});
globalStyle(`${frame}[data-mode="thumb"] ${signedTile}`, {
  height: '32px',
  padding: '6px',
});
globalStyle(`${frame}[data-mode="thumb"] ${traffic}`, {gap: '2px'});
globalStyle(`${frame}[data-mode="thumb"] ${traffic} i`, {
  width: '3px',
  height: '3px',
});
globalStyle(`${frame}[data-mode="thumb"] ${prompt}`, {fontSize: '11px'});
globalStyle(`${frame}[data-mode="thumb"] ${selected}`, {padding: '4px'});
globalStyle(`${frame}[data-mode="thumb"] ${layoutShape}`, {height: '30px'});
globalStyle(`${frame}[data-mode="thumb"] ${orb}`, {
  width: '14px',
  height: '14px',
});
globalStyle(`${frame}[data-mode="thumb"] ${aa}`, {fontSize: '17px'});
globalStyle(`${frame}[data-mode="thumb"] ${timeline}`, {
  height: '6px',
  marginTop: 0,
});
globalStyle(`${frame}[data-mode="thumb"] ${timeline} i`, {height: '4px'});
globalStyle(`${frame}[data-mode="thumb"] ${timeline} b`, {height: '8px'});
