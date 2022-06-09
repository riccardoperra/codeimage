import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  createUniqueId,
  JSXElement,
  on,
  Suspense,
} from 'solid-js';
import {Loading} from '../Loader';
import {SvgIcon} from './SvgIcon';

interface SvgExternalIconProps {
  content?: string | (() => Promise<typeof import('*.svg')>) | null;
  delay?: number;
}

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
    const uniqueUid = createUniqueId();
    return acc
      .replaceAll(url, `url(#${uniqueUid})`)
      .replaceAll(`id="${id.split('#')[1]}"`, `id="${uniqueUid}"`);
  }, svgContent);
}

export function RemoteSvgIcon(props: SvgExternalIconProps): JSXElement {
  const [src, setSrc] = createSignal<SvgExternalIconProps['content'] | null>();
  const content = createMemo(() => props.content);

  const [data] = createResource(src, async content => {
    const svgResponse =
      typeof content === 'string'
        ? await fetch(content).then(res => res.text())
        : await content().then(e => e.default);
    if (props.delay) {
      await new Promise(r => setTimeout(r, props.delay));
    }

    const innerHTML = randomizeSvgUrlIds(svgResponse);

    return {
      innerHTML,
    };
  });

  createEffect(
    on(content, content => {
      setSrc(() => content as SvgExternalIconProps['content']);
    }),
  );

  return (
    <Suspense fallback={<Loading size={'md'} />}>
      <SvgIcon {...(data() || {})} size={'md'} />
    </Suspense>
  );
}
