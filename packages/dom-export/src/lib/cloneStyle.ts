/**
 * Portions of this file are based on code from dom-to-image-more.
 * MIT Licensed, Copyright 2018 Marc Brooks, Copyright 2015 Anatolii Saienko, Copyright 2012 Paul Bakaus
 *:
 * https://github.com/1904labs/dom-to-image-more
 */
import {isCustomElement, isSlotElement, toArray} from './util';

export function copyFont(
  source: CSSStyleDeclaration,
  target: CSSStyleDeclaration,
) {
  target.font = source.font;
  target.fontFamily = source.fontFamily;
  target.fontFeatureSettings = source.fontFeatureSettings;
  target.fontKerning = source.fontKerning;
  target.fontSize = source.fontSize;
  target.fontStretch = source.fontStretch;
  target.fontStyle = source.fontStyle;
  target.fontVariant = source.fontVariant;
  target.fontVariantCaps = source.fontVariantCaps;
  target.fontVariantEastAsian = source.fontVariantEastAsian;
  target.fontVariantLigatures = source.fontVariantLigatures;
  target.fontVariantNumeric = source.fontVariantNumeric;
  target.fontVariationSettings = source.fontVariationSettings;
  target.fontWeight = source.fontWeight;
}

export function copyUserComputedStyleFast<T extends HTMLElement>(
  sourceComputedStyles: CSSStyleDeclaration,
  parentComputedStyles: CSSStyleDeclaration | null,
  targetElement: T,
) {
  const defaultStyle = getDefaultStyle(targetElement);
  const targetStyle = targetElement.style;

  toArray(sourceComputedStyles).forEach(name => {
    const typedName = name as string;
    const sourceValue = sourceComputedStyles.getPropertyValue(typedName);

    // This is needed to be able to "treeshake" web fonts during embedding
    if (
      (name === 'font-family' ||
        name === 'font-weight' ||
        name === 'font-style') &&
      !!sourceValue
    ) {
      targetStyle.setProperty(name, sourceValue);
    }

    // If the style does not match the default, or it does not match the parent's, set it. We don't know which
    // styles are inherited from the parent and which aren't, so we have to always check both.
    if (
      sourceValue !== defaultStyle[typedName] ||
      (parentComputedStyles &&
        sourceValue !== parentComputedStyles.getPropertyValue(typedName))
    ) {
      const priority = sourceComputedStyles.getPropertyPriority(typedName);
      setStyleProperty(targetStyle, typedName, sourceValue, priority);
    }
  });
}

function setStyleProperty(
  targetStyle: CSSStyleDeclaration,
  name: string,
  value: string,
  priority?: string,
) {
  const needs_prefixing = ['background-clip'].indexOf(name) >= 0;
  if (priority) {
    targetStyle.setProperty(name, value, priority);
    if (needs_prefixing) {
      targetStyle.setProperty(`-webkit-${name}`, value, priority);
    }
  } else {
    targetStyle.setProperty(name, value);
    if (needs_prefixing) {
      targetStyle.setProperty(`-webkit-${name}`, value);
    }
  }
}

let removeDefaultStylesTimeoutId: number | null = null;
let sandbox: HTMLIFrameElement | null = null;
let tagNameDefaultStyles: Record<string, Record<string, string>> = {};

function getDefaultStyle<T extends Element>(element: T) {
  const tagName = element.tagName;
  if (tagNameDefaultStyles[tagName]) {
    return tagNameDefaultStyles[tagName];
  }
  if (!sandbox) {
    // Create a hidden sandbox <iframe> element within we can create default HTML elements and query their
    // computed styles. Elements must be rendered in order to query their computed styles. The <iframe> won't
    // render at all with `display: none`, so we have to use `visibility: hidden` with `position: fixed`.
    sandbox = document.createElement('iframe');
    sandbox.style.visibility = 'hidden';
    sandbox.style.position = 'fixed';
    document.body.appendChild(sandbox);
    // Ensure that the iframe is rendered in standard mode
    if (sandbox.contentWindow) {
      sandbox.contentWindow.document.write(
        '<!DOCTYPE html><meta charset="UTF-8"><title>sandbox</title><body>',
      );
    }
  }
  if (!sandbox.contentWindow) return {};

  const defaultStyle: Record<string, string> = {};

  if (!isSlotElement(element) && !isCustomElement(element)) {
    const defaultElement = document.createElement(tagName);
    sandbox.contentWindow.document.body.appendChild(defaultElement);
    // Ensure that there is some content, so that properties like margin are applied.
    defaultElement.textContent = '.';

    copyCSSStyleDeclaration(
      defaultStyle,
      sandbox.contentWindow.getComputedStyle(defaultElement),
    );

    sandbox.contentWindow.document.body.removeChild(defaultElement);
    return defaultStyle;
  } else {
    copyCSSStyleDeclaration(defaultStyle, window.getComputedStyle(element));
  }

  return defaultStyle;
}

function copyCSSStyleDeclaration(
  targetDefaultStyle: Record<string, string>,
  declaration: CSSStyleDeclaration,
) {
  // Copy styles to an object, making sure that 'width' and 'height' are given the default value of 'auto', since
  // their initial value is always 'auto' despite that the default computed value is sometimes an absolute length.
  toArray(declaration).forEach(name => {
    const typedName = name as string;
    targetDefaultStyle[typedName] =
      name === 'width' || name === 'height'
        ? 'auto'
        : declaration.getPropertyValue(typedName);
  });
  return targetDefaultStyle;
}

export function removeSandbox() {
  if (!sandbox) {
    return;
  }
  document.body.removeChild(sandbox);
  sandbox = null;
  if (removeDefaultStylesTimeoutId) {
    clearTimeout(removeDefaultStylesTimeoutId);
  }
  removeDefaultStylesTimeoutId = setTimeout(() => {
    removeDefaultStylesTimeoutId = null;
    tagNameDefaultStyles = {};
  }, 20 * 1000);
}
