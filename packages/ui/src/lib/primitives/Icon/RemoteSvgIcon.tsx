import type {Element as JSXElement} from 'solid-js';
import {createMemo, Loading} from 'solid-js';
import {Loading as LoadingIndicator} from '../Loader';
import type {SvgIconProps} from './SvgIcon';
import {SvgIcon} from './SvgIcon';

export interface SvgExternalIconProps {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  content?: string | (() => Promise<typeof import('*.svg')>) | null;
  delay?: number;
  size?: SvgIconProps['size'];
}

let svgUrlIdCount = 0;

/**
 * Randomize all svg ids of `fill` property when using url(#reference) and defs.
 * ATTENTION: this fixed a Chrome/Firefox bug which is unable to render svg icons
 * if loaded dynamically while using <defs/> and fill property with `url(#reference)`
 *
 * @param svgContent
 */
function randomizeSvgUrlIds(svgContent: string): string {
  const extractSvgUrl = /url\(([^)]+)\)/g;
  const regexpResult = [...extractSvgUrl[Symbol.matchAll](svgContent)];
  const groups = regexpResult.map(result => [result[0], result[1]] as const);

  return groups.reduce((acc, [url, id]) => {
    const uniqueUid = `svg-url-${svgUrlIdCount++}`;
    return acc
      .replaceAll(url, `url(#${uniqueUid})`)
      .replaceAll(`id="${id.split('#')[1]}"`, `id="${uniqueUid}"`);
  }, svgContent);
}

function parseSvg(svgContent: string) {
  const [, attributes = '', innerHTML = ''] =
    /<svg\b([^>]*)>([\s\S]*)<\/svg>/i.exec(svgContent) ?? [];
  return {
    innerHTML,
    viewBox: /\bviewBox="([^"]*)"/i.exec(attributes)?.[1],
  };
}

export function RemoteSvgIcon(props: SvgExternalIconProps): JSXElement {
  const data = createMemo(() => loadSvg(props.content, props.delay));

  return (
    <Loading fallback={<LoadingIndicator size={props.size ?? 'md'} />}>
      <SvgIcon {...(data() || {})} size={props.size ?? 'md'} />
    </Loading>
  );
}

async function loadSvg(content: SvgExternalIconProps['content'], delay = 0) {
  if (!content) return;
  const source =
    typeof content === 'string'
      ? await fetch(content).then(response => response.text())
      : (await content()).default;
  if (delay) await new Promise(resolve => setTimeout(resolve, delay));
  return parseSvg(randomizeSvgUrlIds(source));
}
