import {createGlobalTheme, createTheme} from '@vanilla-extract/css';
import {MapLeafNodes} from '@vanilla-extract/private';
import {themeColors} from '../theme/theme.css';

export function createGlobalCodeImageTheme(
  theme: string,
  tokens: MapLeafNodes<typeof themeColors, string>,
) {
  createGlobalTheme(`[data-codeimage-theme=${theme}]`, themeColors, tokens);
}

export function createCodeImageTheme(
  theme: string,
  tokens: MapLeafNodes<typeof themeColors, string>,
): string {
  return createTheme(themeColors, tokens);
}
