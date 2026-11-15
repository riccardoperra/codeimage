import {parse, parseFragment, serialize} from 'parse5';
import type {DefaultTreeAdapterMap} from 'parse5';
import type {MeasuredNode} from '@takumi-rs/core';
import {placeWatermark} from './watermark';
import type {Rect} from './watermark';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['node'];
type Kind =
  | 'frame'
  | 'window'
  | 'content'
  | 'home'
  | 'header'
  | 'code'
  | 'obstacle';
const attr = (el: Element, name: string) =>
  el.attrs.find(a => a.name === name)?.value;
const has = (el: Element, name: string) => attr(el, name) !== undefined;
const element = (node: Node): node is Element => 'tagName' in node;
const children = (node: Node): Node[] =>
  'childNodes' in node ? node.childNodes : [];
const fragment = (html: string) => parseFragment(html).childNodes;

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
  measure(html: string): Promise<MeasuredNode>;
}): Promise<string> {
  const document = parse(options.html);
  let prefix = 'CI_WATERMARK_PROBE_';
  while (options.html.includes(prefix)) prefix += '_';
  // Takumi returns geometry without HTML attributes. Absolute probes identify their parent without changing flow.
  const probes = new Map<string, {kind: Kind; element: Element}>();
  let home: Element | undefined, frame: Element | undefined;
  const walk = (node: Node, inCode = false, inSignature = false) => {
    if (!element(node)) {
      children(node).forEach(child => walk(child, inCode, inSignature));
      return;
    }
    const code =
      inCode || (attr(node, 'class') ?? '').split(/\s+/).includes('cm-line');
    let kind: Kind | undefined;
    if (has(node, 'data-watermark-frame')) {
      kind = 'frame';
      frame = node;
    } else if (has(node, 'data-surface')) kind = 'window';
    else if (has(node, 'data-watermark-content')) kind = 'content';
    else if (has(node, 'data-watermark-home')) {
      kind = 'home';
      home = node;
    } else if (has(node, 'data-watermark-header')) kind = 'header';
    else if (
      inSignature ||
      has(node, 'data-watermark-obstacle') ||
      node.tagName === 'button' ||
      attr(node, 'role') === 'tab'
    )
      kind = 'obstacle';
    else if (code && !inCode) kind = 'code';
    const original = [...node.childNodes];
    for (const child of original)
      walk(child, code, has(node, 'data-frame-signature'));
    if (code) {
      node.childNodes = node.childNodes.flatMap(child => {
        if (child.nodeName !== '#text' || !('value' in child)) return [child];
        return fragment(
          child.value
            .split(/(\s+)/u)
            .filter(Boolean)
            .map(
              text =>
                `<span>${text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</span>`,
            )
            .join(''),
        );
      });
    }
    if (kind === 'code') {
      // Takumi's run offsets exclude their own node's padding. An unpadded child exposes the content origin.
      const content = fragment(
        '<div style="display:block;padding:0;margin:0;border:0;min-width:0"></div>',
      )[0];
      if (content && element(content)) {
        content.childNodes = node.childNodes;
        content.childNodes.forEach(child => {
          child.parentNode = content;
        });
        content.parentNode = node;
        node.childNodes = [content];
      }
    }
    if (kind) {
      const key = `${prefix}${probes.size}_END`;
      probes.set(key, {kind, element: node});
      const marker = fragment(
        `<span style="position:absolute;left:0;top:0;opacity:0;font-size:1px;line-height:1px;white-space:pre">${key}</span>`,
      )[0];
      if (marker) {
        marker.parentNode = node;
        node.childNodes.push(marker);
      }
    }
  };
  walk(document);
  if (!home || !frame) return options.html;
  const measured = await options.measure(serialize(document));
  const boxes = new Map<Kind, Rect[]>();
  const text: Rect[] = [];
  const collectText = (node: MeasuredNode, target: Rect[] = text) => {
    for (const run of node.runs)
      if (/\S/u.test(run.text) && !probes.has(run.text))
        target.push(
          rect(node, {
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
        list.push(rect(target));
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
    gap: (4 * homeRect.width) / 125,
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
      `<span style="display:inline-block;width:125px;height:${(homeRect.height * 125) / homeRect.width}px"></span>`,
    );
    const scale = homeRect.width / 125;
    const moved = fragment(
      `<div data-watermark-moved="${placement.slot}" style="position:absolute;left:${placement.rect.x - frameRect.x}px;top:${placement.rect.y - frameRect.y}px;opacity:.35;display:flex;pointer-events:none;z-index:3;transform:scale(${scale});transform-origin:top left"></div>`,
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
