import {
  createEffect,
  createResource,
  createSignal,
  JSXElement,
  Suspense,
} from 'solid-js';
import {spread} from 'solid-js/web';
import {SvgIcon} from './SvgIcon';
import {Loader} from '../../LoadingOverlay/LoadingOverlay';

interface SvgExternalIconProps {
  src?: string | null;
}

function createElement<T>(tag: string, props: T): HTMLElement {
  const el = document.createElement(tag);
  spread(el, () => props, true, false);
  Object.assign(el, {children: Array.from(el.children)});
  return el;
}

export function convertReactSVGDOMProperty(str) {
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
  const ret: Record<string, any> = {};
  for (let prop, i = 0; i < map.length; i++) {
    const attr = map[i];
    if (!startsWith(attr.name, DataPropPrefix)) {
      prop = convertReactSVGDOMProperty(attr.name);
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
  const [src, setSrc] = createSignal<string | null>();

  const [data] = createResource(src, async url => {
    const svgResponse = await fetch(url).then(res => res.text());
    const props = extractSVGProps(svgResponse) || {};
    await new Promise(r => setTimeout(r, 250));
    const innerHTML = getSVGFromSource(svgResponse).innerHTML;
    return {
      ...props,
      innerHTML,
    };
  });

  createEffect(() => setSrc(props.src));

  return (
    <Suspense fallback={<Loader size={'md'} />}>
      <SvgIcon {...(data() || {})} size={'md'} />
    </Suspense>
  );
}
