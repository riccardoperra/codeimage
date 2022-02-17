import {CustomTheme} from '@codegram/theme';
import {useFrameState} from './frame';
import {useTerminalState} from './terminal';
import {useEditorState} from './editor';
import {batch} from 'solid-js';

export function updateTheme(theme: CustomTheme) {
  batch(() => {
    useFrameState.setState({
      background: theme.properties.previewBackground,
    });

    useTerminalState.setState({
      background: theme.properties.terminal.main,
      textColor: theme.properties.terminal.text,
      darkMode: theme.properties.darkMode,
    });

    useEditorState.setState({
      extensions: theme.editorTheme,
    });
  });
}
