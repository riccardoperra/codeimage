import {
  Accessor,
  createContext,
  createEffect,
  ParentProps,
  useContext,
} from 'solid-js';
import * as styles from '../primitives/Text/Text.css';

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
    // eslint-disable-next-line solid/reactivity
    text: props.tokens.text ?? {},
  };

  const theme = () => props.theme ?? 'dark';

  createEffect(() => {
    document.documentElement.setAttribute(
      'data-codeimage-theme',
      props.theme ?? 'dark',
    );
  });

  return (
    <ThemeTokensContext.Provider
      value={{
        theme,
        tokens,
      }}
    >
      {props.children}
    </ThemeTokensContext.Provider>
  );
}

export function useTheme(): ThemeContext {
  const context = useContext(ThemeTokensContext);
  if (!context) {
    throw new Error('CodeImage theme provider is not registered');
  }
  return context;
}
