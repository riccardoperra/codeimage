import {CustomTheme} from '@codegram/theme';
import {useFrameState} from './frame';
import {useTerminalState} from './terminal';
import {useEditorState} from './editor';

export function updateTheme(theme: CustomTheme) {
  useFrameState.setState({
    background: theme.properties.previewBackground,
  });

  useTerminalState.setState({
    background: theme.properties.terminal.main,
    textColor: theme.properties.terminal.text,
  });

  useEditorState.setState({
    extensions: theme.editorTheme,
  });
}
