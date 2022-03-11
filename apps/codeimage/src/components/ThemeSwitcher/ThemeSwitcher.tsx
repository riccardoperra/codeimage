import {For, JSXElement, lazy, Suspense, SuspenseList} from 'solid-js';
import {Text} from '../ui/Text/Text';
import * as styles from './ThemeSwitcher.css';
import {gridSize, ThemeSwitcherVariant} from './ThemeSwitcher.css';
import {useTerminalState} from '../../state/terminal';
import {updateTheme} from '../../state/state';
import {DynamicTerminal} from '../Terminal/dynamic/DynamicTerminal';
import {useStaticConfiguration} from '../../core/configuration';
import {assignInlineVars} from '@vanilla-extract/dynamic';
import {Box} from '../ui/Box/Box';

// eslint-disable-next-line @typescript-eslint/ban-types
export type ThemeSwitcherProps = {} & ThemeSwitcherVariant;

const LazyThemeBox = lazy(() => import('./ThemeBox'));

export default function ThemeSwitcher(props: ThemeSwitcherProps): JSXElement {
  const {themes} = useStaticConfiguration();
  const terminal = useTerminalState();

  return (
    <Box
      class={styles.grid({
        orientation: props.orientation,
      })}
      style={assignInlineVars({
        [gridSize]: themes.length.toString(),
      })}
    >
      <SuspenseList revealOrder={'together'} tail={'collapsed'}>
        <For each={themes}>
          {theme => (
            <Suspense
              fallback={
                <>
                  <div class="loading-wrapper">
                    <div class="title-block">
                      <div class="loading content"></div>
                      <div class="loading content last-row"></div>
                    </div>
                    <div class="title-block">
                      <div class="loading title"></div>
                      <div class="loading content"></div>
                      <div class="loading content last-row"></div>
                    </div>
                    <div class="list-block">
                      <div class="loading content line-item"></div>
                      <div class="loading content line-item-last"></div>
                    </div>
                  </div>
                </>
              }
            >
              <LazyThemeBox theme={theme} onClick={() => updateTheme(theme)}>
                <DynamicTerminal
                  tabName={'Untitled'}
                  textColor={theme.properties.terminal.text}
                  background={theme.properties.terminal.main}
                  darkMode={theme.properties.darkMode}
                  accentVisible={terminal.accentVisible}
                  shadow={terminal.shadow}
                  showTab={true}
                  readonlyTab={true}
                  showHeader={true}
                  type={terminal.type}
                >
                  <Text size={'sm'}>{`// Code here`}</Text>
                </DynamicTerminal>
              </LazyThemeBox>
            </Suspense>
          )}
        </For>
      </SuspenseList>
    </Box>
  );
}
