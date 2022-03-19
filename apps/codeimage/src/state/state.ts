import {CustomTheme} from '@codeimage/theme';
import {setBackground} from './frame';
import {updateTerminalStore} from './terminal';
import {setTheme} from './editor';
import {batch} from 'solid-js';
import {setProps} from '@ngneat/elf';

export function updateTheme(theme: CustomTheme) {
  batch(() => {
    setBackground(theme.properties.previewBackground);

    updateTerminalStore(
      setProps({
        background: theme.properties.terminal.main,
        textColor: theme.properties.terminal.text,
        darkMode: theme.properties.darkMode,
      }),
    );

    setTheme(theme.id);
  });
}
