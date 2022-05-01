import {
  createContext,
  createEffect,
  PropsWithChildren,
  useContext,
} from 'solid-js';
import {createStore} from 'solid-js/store';
import * as styles from '../primitives/Text/Text.css';

export interface TextThemeTokens {
  size?: keyof typeof styles.fontSize;
  weight?: keyof typeof styles.fontWeight;
}

interface BaseThemeTokens {
  text: TextThemeTokens;
}

const ThemeTokensContext = createContext<BaseThemeTokens>();

export function CodeImageThemeProvider(
  props: PropsWithChildren<{theme: Partial<BaseThemeTokens>}>,
) {
  const componentsTheme: BaseThemeTokens = {
    text: props.theme.text ?? {},
  };

  return (
    <ThemeTokensContext.Provider value={componentsTheme}>
      {props.children}
    </ThemeTokensContext.Provider>
  );
}

export function useTheme(): BaseThemeTokens {
  const context = useContext(ThemeTokensContext);
  if (!context) {
    throw new Error('CodeImage theme provider is not registered');
  }
  return context;
}
