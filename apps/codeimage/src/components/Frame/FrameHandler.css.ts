import {createTheme, style} from '@vanilla-extract/css';

export const [frameHandler, frameHandlerVars] = createTheme({
  scale: '1',
});

export const wrapper = style({
  width: '100%',
  height: '100%',
  display: 'flex',
  overflowY: 'auto',
  overflowX: 'hidden',
  flex: '1',
  alignItems: 'center',
  justifyContent: 'center',
});

export const handler = style([
  {
    // TODO: this is a workaround to fix gutters and cursor in mobile view
    // zoom: `${frameHandlerVars.scale}`,
    transform: `scale(${frameHandlerVars.scale})`,
    display: 'block',
    position: 'relative',
    margin: 'auto',
  },
]);

export const content = style({
  width: '100%',
  height: '100%',
  marginTop: '20px',
  marginBottom: '40px',
  position: 'relative',
});
