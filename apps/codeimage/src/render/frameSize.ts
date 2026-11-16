import type {FrameSize} from './contract';

import * as styles from '../components/Frame/Frame.css';

const cssVar = (variable: string) =>
  variable.replace(/^var\((--[^,)]+).*$/, '$1');

export function frameSizeCss(size?: FrameSize): string {
  const declarations = size
    ? [
        [styles.frameVars.width, `${size.width}px`],
        [styles.frameVars.minWidth, `${size.width}px`],
        [styles.frameVars.height, `${size.height}px`],
      ]
    : [
        [styles.frameVars.width, 'max-content'],
        [styles.frameVars.maxWidth, 'none'],
      ];
  return `[data-snapshot-frame]{${declarations
    .map(([variable, value]) => `${cssVar(variable)}:${value}!important`)
    .join(';')}}`;
}
