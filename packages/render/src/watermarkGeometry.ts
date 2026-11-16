import {has, element, children, fragment} from './htmlTree';
import type {Element, Node} from './htmlTree';
import {watermarkProbes} from './watermarkProbes';
import type {Kind} from './watermarkProbes';
import {parse, serialize} from 'parse5';
import type {MeasuredNode} from '@takumi-rs/core';
import {placeWatermark, WATERMARK} from './watermark';
import type {Rect} from './watermark';

function rect(
  node: MeasuredNode,
  box: Rect = {x: 0, y: 0, width: node.width, height: node.height},
): Rect {
  const [a, b, c, d, e, f] = node.transform;
  const points = [
    [box.x, box.y],
    [box.x + box.width, box.y],
    [box.x, box.y + box.height],
    [box.x + box.width, box.y + box.height],
  ].map(([x, y]) => ({x: a * x + c * y + e, y: b * x + d * y + f}));
  const xs = points.map(p => p.x),
    ys = points.map(p => p.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys),
  };
}

export async function positionWatermark(options: {
  html: string;
  painted: boolean;
  inset: number;
  pixelRatio?: number;
  measure(html: string): Promise<MeasuredNode>;
}): Promise<string> {
  const measuredRect = (node: MeasuredNode, box?: Rect): Rect => {
    const bounds = rect(node, box);
    const ratio = options.pixelRatio ?? 1;
    return {
      x: bounds.x / ratio,
      y: bounds.y / ratio,
      width: bounds.width / ratio,
      height: bounds.height / ratio,
    };
  };
  const {document, probes, home, frame} = watermarkProbes(options.html);
  if (!home || !frame) return options.html;
  const measured = await options.measure(serialize(document));
  const boxes = new Map<Kind, Rect[]>();
  const text: Rect[] = [];
  const collectText = (node: MeasuredNode, target: Rect[] = text) => {
    for (const run of node.runs)
      if (/\S/u.test(run.text) && !probes.has(run.text))
        target.push(
          measuredRect(node, {
            x: run.x,
            y: run.y,
            width: run.width,
            height: run.height,
          }),
        );
    node.children.forEach(child => collectText(child, target));
  };
  const visit = (node: MeasuredNode) => {
    for (const child of node.children)
      for (const run of child.runs) {
        const probe = probes.get(run.text);
        if (!probe) continue;
        const list = boxes.get(probe.kind) ?? [];
        const target =
          probe.kind === 'home'
            ? (node.children.find(
                child =>
                  child.width > 0 &&
                  child.height > 0 &&
                  !child.runs.some(run => probes.has(run.text)),
              ) ?? node)
            : node;
        list.push(measuredRect(target));
        boxes.set(probe.kind, list);
        if (probe.kind === 'code') collectText(node);
        if (probe.kind === 'header') {
          const obstacles = boxes.get('obstacle') ?? [];
          collectText(node, obstacles);
          boxes.set('obstacle', obstacles);
        }
      }
    node.children.forEach(visit);
  };
  visit(measured);
  const first = (kind: Kind) => boxes.get(kind)?.[0];
  const homeRect = first('home'),
    frameRect = first('frame'),
    windowRect = first('window'),
    content = first('content');
  if (!homeRect || !frameRect || !windowRect || !content)
    throw new Error('Takumi did not preserve watermark measurement anchors');
  const placement = placeWatermark({
    home: homeRect,
    window: windowRect,
    content,
    header: first('header') ?? null,
    frame: options.painted ? {bounds: frameRect, inset: options.inset} : null,
    code: text,
    obstacles: boxes.get('obstacle') ?? [],
    gap: (WATERMARK.gap * homeRect.width) / WATERMARK.width,
  });
  const clean = parse(options.html);
  let cleanHome: Element | undefined, cleanFrame: Element | undefined;
  const find = (node: Node) => {
    if (element(node)) {
      if (has(node, 'data-watermark-home')) cleanHome = node;
      if (has(node, 'data-watermark-frame')) cleanFrame = node;
    }
    children(node).forEach(find);
  };
  find(clean);
  if (!cleanHome || !cleanFrame) return options.html;
  cleanHome.attrs.push({
    name: 'data-watermark-placement',
    value: placement.slot,
  });
  if ('rect' in placement) {
    const logo = cleanHome.childNodes;
    cleanHome.childNodes = fragment(
      `<span style="display:inline-block;width:${WATERMARK.width}px;height:${(homeRect.height * WATERMARK.width) / homeRect.width}px"></span>`,
    );
    const scale = homeRect.width / WATERMARK.width;
    const moved = fragment(
      `<div data-watermark-moved="${placement.slot}" style="position:absolute;left:${placement.rect.x - frameRect.x}px;top:${placement.rect.y - frameRect.y}px;opacity:${WATERMARK.opacity};display:flex;pointer-events:none;z-index:${WATERMARK.zIndex};transform:scale(${scale});transform-origin:top left"></div>`,
    )[0];
    if (moved && element(moved)) {
      moved.childNodes = logo;
      logo.forEach(child => {
        child.parentNode = moved;
      });
      moved.parentNode = cleanFrame;
      cleanFrame.childNodes.push(moved);
    }
  }
  return serialize(clean);
}
