import {css} from '@emotion/css';

export interface ExternalStylesheetTheme {
  scope: string;
  className: string;
  parentClass: string;
}

export function buildExternalStylesheet(
  scope: string,
): (style: string) => ExternalStylesheetTheme {
  return (style: string) => {
    const className = css`
      .cm-external-theme-${scope} & {
        ${style}
      }
    `;
    return {
      scope,
      className,
      parentClass: `cm-external-theme-${scope}`,
    };
  };
}
