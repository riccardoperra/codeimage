import {
  createEffect,
  createResource,
  createSignal,
  JSXElement,
  Suspense,
} from 'solid-js';
import {SvgIcon} from './SvgIcon';
import {Loader} from '../../components/LoadingOverlay/LoadingOverlay';
import {LanguageIconDefinition} from '@codeimage/config';

interface SvgExternalIconProps {
  content?: LanguageIconDefinition['content'] | null;
  delay?: number;
}

export function convertSolidSVGDOMProperty(str: string) {
  return str.replace(/[-|:]([a-z])/g, function (g) {
    return g[1].toUpperCase();
  });
}

export function startsWith(str: string, substring: string) {
  return str.indexOf(substring) === 0;
}

const DataPropPrefix = 'data-';

// Serialize `Attr` objects in `NamedNodeMap`
export function serializeAttrs(map: NamedNodeMap) {
  const ret: Record<string, unknown> = {};
  for (let prop, i = 0; i < map.length; i++) {
    const attr = map[i];
    if (!startsWith(attr.name, DataPropPrefix)) {
      prop = convertSolidSVGDOMProperty(attr.name);
    } else {
      prop = attr.name;
    }
    ret[prop] = map[i].value;
  }
  return ret;
}

export function getSVGFromSource(src: string) {
  const svgContainer = document.createElement('div');
  svgContainer.innerHTML = src;
  const svg = svgContainer.firstElementChild as HTMLElement;
  svg.remove ? svg.remove() : svgContainer.removeChild(svg); // deref from parent element
  return svg;
}

// get <svg /> element props
export function extractSVGProps(src: string) {
  const map = getSVGFromSource(src).attributes;
  return map.length > 0 ? serializeAttrs(map) : null;
}

export function SvgExternalIcon(props: SvgExternalIconProps): JSXElement {
  const [src, setSrc] = createSignal<
    LanguageIconDefinition['content'] | null
  >();

  const [data] = createResource(src, async content => {
    const svgResponse =
      typeof content === 'string'
        ? await fetch(content).then(res => res.text())
        : await content().then(e => e.default);
    const svgProps = extractSVGProps(svgResponse) || {};
    if (props.delay) {
      await new Promise(r => setTimeout(r, props.delay));
    }
    const innerHTML = getSVGFromSource(svgResponse).innerHTML;
    return {
      ...svgProps,
      innerHTML,
    };
  });

  createEffect(() => setSrc(() => props.content));

  return (
    <Suspense fallback={<Loader size={'md'} />}>
      <SvgIcon {...(data() || {})} size={'md'} />
    </Suspense>
  );
}
