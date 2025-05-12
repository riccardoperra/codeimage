import {type ParentComponent} from 'solid-js';
import {type BaseTerminalProps} from '../TerminalHost';
import {MacOsTerminal} from './MacOsTerminal';

export const MacOsTerminalOutlineTheme: ParentComponent<
  BaseTerminalProps
> = props => {
  return <MacOsTerminal headerType={'outline'} {...props} />;
};
