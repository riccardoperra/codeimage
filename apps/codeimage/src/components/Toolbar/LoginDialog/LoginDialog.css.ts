import {themeTokens, themeVars} from '@codeui/kit';
import {globalStyle, keyframes, style} from '@vanilla-extract/css';

export const titleLogin = style({
  fontSize: '2rem',
  textAlign: 'center',
  fontWeight: themeTokens.fontWeight.bold,
  display: 'flex',
  flexDirection: 'column',
  gap: themeTokens.spacing['4'],
  alignItems: 'center',
  marginTop: themeTokens.spacing['8'],
});

export const loginBox = style({
  display: 'flex',
  flexDirection: 'column',
  gap: themeTokens.spacing['2'],
  marginTop: themeTokens.spacing['12'],
  marginBottom: themeTokens.spacing['12'],
});

export const closeIcon = style({
  width: '100%',
  display: 'flex',
  justifyContent: 'flex-end',
});

const backdropFilter = keyframes({
  '0%': {
    backdropFilter: 'blur(0px) saturate(180%)',
  },
  '100%': {
    backdropFilter: 'blur(20px) saturate(180%)',
  },
});

globalStyle('div[data-panel-size]:has(div[id=loginDialog-content])', {
  animation: `${backdropFilter} 150ms normal forwards ease-in-out`,
});
