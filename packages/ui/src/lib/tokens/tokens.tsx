import type {Accessor, ParentProps} from 'solid-js';
import {createContext, createEffect, useContext} from 'solid-js';
import type * as styles from '../primitives/Text/Text.css';

export interface TextThemeTokens {
  size?: keyof typeof styles.fontSize;
  weight?: keyof typeof styles.fontWeight;
}

interface BaseThemeTokens {
  text: TextThemeTokens;
}

interface ThemeContext {
  tokens: BaseThemeTokens;
  theme: Accessor<string>;
}

const ThemeTokensContext = createContext<ThemeContext>();

export interface ThemeProviderProps {
  tokens: Partial<BaseThemeTokens>;
  theme?: string;
}

export function CodeImageThemeProvider(props: ParentProps<ThemeProviderProps>) {
  const tokens: BaseThemeTokens = {
    get text() {
      return props.tokens.text ?? {};
    },
  };

  const theme = () => props.theme ?? 'dark';

  createEffect(theme, theme => {
    document.documentElement.setAttribute('data-cui-theme', theme);
  });

  return (
    <ThemeTokensContext
      value={{
        theme,
        tokens,
      }}
    >
      {props.children}
    </ThemeTokensContext>
  );
}

export function useTheme(): ThemeContext {
  const context = useContext(ThemeTokensContext);
  if (!context) {
    throw new Error('CodeImage theme provider is not registered');
  }
  return context;
}
