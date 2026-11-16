import {parseFragment} from 'parse5';
import type {DefaultTreeAdapterMap} from 'parse5';

export type Element = DefaultTreeAdapterMap['element'];
export type Node = DefaultTreeAdapterMap['node'];
export const attr = (el: Element, name: string) =>
  el.attrs.find(a => a.name === name)?.value;
export const has = (el: Element, name: string) => attr(el, name) !== undefined;
export const element = (node: Node): node is Element => 'tagName' in node;
export const children = (node: Node): Node[] =>
  'childNodes' in node ? node.childNodes : [];
export const fragment = (html: string): DefaultTreeAdapterMap['childNode'][] =>
  parseFragment(html).childNodes;
