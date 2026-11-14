// Plays compiled scenes the way a renderer does, for tests that assert where
// elements are rather than the CSS that puts them there. Supports linear
// easing, which is what the tests use.

export type Element = {
  attributes: Record<string, string>;
  text: string;
  children: Element[];
  parent: Element | null;
};

const entities: Record<string, string> = {
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
};
const decode = (text: string) =>
  text.replace(/&(lt|gt|amp|quot);/g, entity => entities[entity]);

export function parseHtml(html: string): Element {
  const root: Element = {attributes: {}, text: '', children: [], parent: null};
  let open = root;
  for (const [, closing, attributes, text] of html.matchAll(
    /<(\/?)\w+([^>]*)>|([^<]+)/g,
  )) {
    if (text !== undefined) {
      open.text += decode(text);
    } else if (closing) {
      open = open.parent!;
    } else {
      const element: Element = {
        attributes: Object.fromEntries(
          Array.from(attributes.matchAll(/([\w-]+)="([^"]*)"/g), ([, k, v]) => [
            k,
            decode(v),
          ]),
        ),
        text: '',
        children: [],
        parent: open,
      };
      open.children.push(element);
      open = element;
    }
  }
  return root;
}

export const descendants = (element: Element): Element[] =>
  element.children.flatMap(child => [child, ...descendants(child)]);

type Declarations = Record<string, string>;

const declarations = (text: string): Declarations =>
  Object.fromEntries(
    text
      .split(';')
      .filter(Boolean)
      .map(declaration => {
        const colon = declaration.indexOf(':');
        return [declaration.slice(0, colon), declaration.slice(colon + 1)];
      }),
  );

function keyframes(css: string) {
  const rules = new Map<string, {offset: number; values: Declarations}[]>();
  for (const [, name, body] of css.matchAll(
    /@keyframes ([\w-]+)\{((?:[^{}]*\{[^}]*\})*)\}/g,
  )) {
    rules.set(
      name,
      Array.from(body.matchAll(/([^{}]+)\{([^}]*)\}/g), ([, stop, values]) => ({
        offset:
          stop === 'from' ? 0 : stop === 'to' ? 1 : parseFloat(stop) / 100,
        values: declarations(values),
      })),
    );
  }
  return rules;
}

const number = (value: string) => parseFloat(value);

// The numeric value of every property of `element` at `timeMs`, in pixels for
// lengths. An animation fills both ways, as compileScene asks.
export function styleAt(
  element: Element,
  css: string,
  timeMs: number,
): Record<string, number> {
  const inline = declarations(element.attributes.style ?? '');
  const style: Record<string, number> = {};
  for (const [property, value] of Object.entries(inline)) {
    if (/^-?[\d.]+(px)?$/.test(value)) style[property] = number(value);
  }
  if (!inline.animation) return style;
  const [name, duration, easing, delay] = inline.animation.split(' ');
  if (easing !== 'linear') throw new Error(`Cannot play ${easing}`);
  const stops = keyframes(css).get(name);
  if (!stops) throw new Error(`No keyframes ${name}`);
  const progress = Math.min(
    1,
    Math.max(0, (timeMs - number(delay)) / number(duration)),
  );
  for (const property of new Set(stops.flatMap(s => Object.keys(s.values)))) {
    const defined = stops.filter(stop => property in stop.values);
    const after =
      defined.find(stop => stop.offset >= progress) ?? defined.at(-1)!;
    const before = defined.findLast(stop => stop.offset <= progress) ?? after;
    const span = after.offset - before.offset;
    const ratio = span ? (progress - before.offset) / span : 0;
    const from = number(before.values[property]);
    const to = number(after.values[property]);
    style[property] = Number((from + (to - from) * ratio).toFixed(3));
  }
  return style;
}
