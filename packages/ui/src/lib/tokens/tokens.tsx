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
  const [theme, setTheme] = createStore<BaseThemeTokens>({text: {}});

  createEffect(() => {
    setTheme(_ => ({..._, ...props.theme} as unknown as BaseThemeTokens));
  });

  return (
    <ThemeTokensContext.Provider value={theme}>
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
