import {parse, parseFragment, serialize, serializeOuter} from 'parse5';
import type {DefaultTreeAdapterMap} from 'parse5';
import type {
  AnimationScenes,
  AnimationStepFrame,
  FrameSize,
} from '../../../apps/codeimage/src/render/contract';
import {WATERMARK} from './watermark';

type Node = DefaultTreeAdapterMap['node'];
type ChildNode = DefaultTreeAdapterMap['childNode'];
type Element = DefaultTreeAdapterMap['element'];

const isElement = (node: Node): node is Element => 'tagName' in node;
const attr = (element: Element, name: string) =>
  element.attrs.find(attr => attr.name === name)?.value;

function findElement(node: Node, name: string): Element | undefined {
  if (isElement(node) && attr(node, name) !== undefined) return node;
  for (const child of 'childNodes' in node ? node.childNodes : []) {
    const found = findElement(child, name);
    if (found) return found;
  }
  return undefined;
}

function fragment(html: string, parent: Element): ChildNode[] {
  const nodes = parseFragment(html).childNodes;
  for (const node of nodes) node.parentNode = parent;
  return nodes;
}

// Where positionWatermark put the mark of one step's static export.
interface StepMark {
  slot: string;
  // The home's children and the moved mark, when the mark left its home.
  home: string;
  moved: Element | null;
  size: FrameSize;
}

function readMark(html: string, size: FrameSize): StepMark | null {
  const document = parse(html);
  const home = findElement(document, 'data-watermark-home');
  const slot = home && attr(home, 'data-watermark-placement');
  if (!home || !slot) return null;
  return {
    slot,
    home: serialize(home),
    moved: findElement(document, 'data-watermark-moved') ?? null,
    size,
  };
}

const setStyle = (element: Element, style: string) => {
  element.attrs = [
    ...element.attrs.filter(({name}) => name !== 'style'),
    {name: 'style', value: style},
  ];
};

// A transition resizes the frame, so a mark moved to a right or bottom slot
// hangs from that corner of the frame. At the step's own size it sits where
// the static export put it.
function anchoredMark({slot, moved, size}: StepMark & {moved: Element}) {
  const right = slot.endsWith('right');
  const bottom = slot.startsWith('frame-bottom');
  const html = serializeOuter(moved);
  if (!right && !bottom) return html;
  const anchor = fragment(
    `<div data-watermark-anchor style="position:absolute;${right ? 'right' : 'left'}:0;${bottom ? 'bottom' : 'top'}:0;width:0;height:0;z-index:${WATERMARK.zIndex}">${html}</div>`,
    moved,
  )[0] as Element;
  const mark = anchor.childNodes.find(isElement)!;
  const shift = (property: string, by: number) => (value: string) =>
    value.replace(
      new RegExp(`(^|;)${property}:(-?[\\d.e+-]+)px`),
      (_, start: string, length: string) =>
        `${start}${property}:${Number(length) - by}px`,
    );
  setStyle(
    mark,
    [
      shift('left', right ? size.width : 0),
      shift('top', bottom ? size.height : 0),
    ].reduce((style, apply) => apply(style), attr(mark, 'style') ?? ''),
  );
  return serializeOuter(anchor);
}

function applyMark(html: string, mark: StepMark | null, anchor: boolean) {
  if (!mark) return html;
  const document = parse(html);
  const home = findElement(document, 'data-watermark-home');
  const frame = findElement(document, 'data-watermark-frame');
  if (!home || !frame) return html;
  home.attrs.push({name: 'data-watermark-placement', value: mark.slot});
  if (mark.moved) {
    home.childNodes = fragment(mark.home, home);
    frame.childNodes.push(
      ...fragment(
        anchor
          ? anchoredMark({...mark, moved: mark.moved})
          : serializeOuter(mark.moved),
        frame,
      ),
    );
  }
  return serialize(document);
}

/**
 * Gives every scene the watermark of its step's static export. `place` runs
 * positionWatermark on that export, as the static path does. A hold then
 * draws the static export exactly, and a transition starts and ends with the
 * mark of the step at that end, since its own frame still holds tokens that
 * are hidden there.
 */
export async function watermarkScenes(
  animation: Pick<AnimationScenes, 'scenes' | 'steps'>,
  place: (step: AnimationStepFrame) => Promise<string>,
): Promise<AnimationScenes['scenes']> {
  const placed = new Map<AnimationStepFrame, Promise<StepMark | null>>();
  const marks = await Promise.all(
    animation.steps.map(step => {
      if (!placed.has(step)) {
        placed.set(
          step,
          place(step).then(html => readMark(html, step.exactSize)),
        );
      }
      return placed.get(step)!;
    }),
  );
  return animation.scenes.map(scene => ({
    ...scene,
    html: applyMark(scene.html, marks[scene.step], scene.kind === 'transition'),
  }));
}
