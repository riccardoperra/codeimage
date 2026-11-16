import {parseWindowType} from '@core/configuration/windowTypes';

import {AVAILABLE_TERMINAL_THEMES} from '@core/configuration/terminal-themes';

import type {JSXElement, ParentComponent} from 'solid-js';
import {children, createMemo} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use/props';
import {Watermark} from '../../Watermark/Watermark';
import type {BaseTerminalProps} from '../TerminalHost';
import {createTabTheme} from '../Tabs/createTabTheme';

interface DynamicTerminalProps extends BaseTerminalProps {
  type: string;
}

export const DynamicTerminal: ParentComponent<DynamicTerminalProps> = (
  props,
): JSXElement => {
  const terminalThemes = AVAILABLE_TERMINAL_THEMES;
  const tabTheme = createTabTheme(() => props.themeId);

  const terminal = createMemo(
    () => terminalThemes.entries[parseWindowType(props.type)].component,
  );

  const resolvedChildren = children(() => props.children);

  return (
    <Dynamic component={terminal()} {...omitProps(props, ['type'])}>
      {resolvedChildren()}

      <Watermark enabled={props.showWatermark} darkMode={tabTheme().darkMode} />
    </Dynamic>
  );
};
