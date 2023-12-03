import {ParentComponent} from 'solid-js';
import {BaseTerminalProps} from '../TerminalHost';
import {MacOsTerminal} from './MacOsTerminal';

export const MacOsTerminalOutlineTheme: ParentComponent<
  BaseTerminalProps
> = props => {
  return <MacOsTerminal headerType={'outline'} {...props} />;
};
