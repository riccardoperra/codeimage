import {parse, parseFragment} from 'parse5';
import type {DefaultTreeAdapterMap} from 'parse5';

import {WATERMARK} from './watermark';

type Element = DefaultTreeAdapterMap['element'];
type Node = DefaultTreeAdapterMap['node'];
export type Kind =
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

export function watermarkProbes(html: string): {
  document: DefaultTreeAdapterMap['document'];
  probes: Map<string, {kind: Kind; element: Element}>;
  home: Element | undefined;
  frame: Element | undefined;
} {
  const document = parse(html);
  let prefix = 'CI_WATERMARK_PROBE_';
  while (html.includes(prefix)) prefix += '_';

  const probes = new Map<string, {kind: Kind; element: Element}>();
  let home: Element | undefined, frame: Element | undefined;
  const walk = (node: Node, inCode = false, inSignature = false) => {
    if (!element(node)) {
      children(node).forEach(child => walk(child, inCode, inSignature));
      return;
    }
    const code =
      inCode ||
      (attr(node, 'class') ?? '').split(/\s+/).includes(WATERMARK.codeClass);
    const kind = probeKind(node, inSignature, code, inCode);
    if (kind === 'frame') frame = node;
    if (kind === 'home') home = node;
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

  return {document, probes, home, frame};
}
function probeKind(
  node: Element,
  inSignature: boolean,
  code: boolean,
  inCode: boolean,
): Kind | undefined {
  if (has(node, 'data-watermark-frame')) {
    return 'frame';
  } else if (has(node, 'data-surface')) return 'window';
  else if (has(node, 'data-watermark-content')) return 'content';
  else if (has(node, 'data-watermark-home')) {
    return 'home';
  } else if (has(node, 'data-watermark-header')) return 'header';
  else if (
    inSignature ||
    has(node, 'data-watermark-obstacle') ||
    node.tagName === 'button' ||
    attr(node, 'role') === 'tab'
  )
    return 'obstacle';
  else if (code && !inCode) return 'code';
}
