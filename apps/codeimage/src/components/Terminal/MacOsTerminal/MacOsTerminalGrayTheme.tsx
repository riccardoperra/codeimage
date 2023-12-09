import {ParentComponent} from 'solid-js';
import {BaseTerminalProps} from '../TerminalHost';
import {MacOsTerminal} from './MacOsTerminal';

export const MacOsTerminalGrayTheme: ParentComponent<
  BaseTerminalProps
> = props => {
  return <MacOsTerminal headerType={'gray'} {...props} />;
};
