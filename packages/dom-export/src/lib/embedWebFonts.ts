import {fetchAsDataURL} from './dataurl';
import {embedResources, shouldEmbed} from './embedResources';
import {Options} from './options';
import {toArray} from './util';

interface Metadata {
  url: string;
  cssText: string;
}

type FontsMap = Record<string, Record<string, CSSStyleRule>>;

const cssFetchCache: {[href: string]: Metadata} = {};

const REGEXP_QUOTE_FONT_FAMILY = /^['"]|['"]$/g;

async function fetchCSS(url: string) {
  let cache = cssFetchCache[url];
  if (cache != null) {
    return cache;
  }

  const res = await fetch(url);
  const cssText = await res.text();
  cache = {url, cssText};

  cssFetchCache[url] = cache;

  return cache;
}

async function embedFonts(data: Metadata, options: Options): Promise<string> {
  let cssText = data.cssText;
  const regexUrl = /url\(["']?([^"')]+)["']?\)/g;
  const fontLocs = cssText.match(/url\([^)]+\)/g) || [];
  const loadFonts = fontLocs.map(async (loc: string) => {
    let url = loc.replace(regexUrl, '$1');
    if (!url.startsWith('https://')) {
      url = new URL(url, data.url).href;
    }

    return fetchAsDataURL<[string, string]>(
      url,
      options.fetchRequestInit,
      ({result}) => {
        cssText = cssText.replace(loc, `url(${result})`);
        return [loc, result];
      },
    );
  });

  return Promise.all(loadFonts).then(() => cssText);
}

function parseCSS(source: string) {
  if (source == null) {
    return [];
  }

  const result: string[] = [];
  const commentsRegex = /(\/\*[\s\S]*?\*\/)/gi;
  // strip out comments
  let cssText = source.replace(commentsRegex, '');

  // eslint-disable-next-line prefer-regex-literals
  const keyframesRegex = new RegExp(
    '((@.*?keyframes [\\s\\S]*?){([\\s\\S]*?}\\s*?)})',
    'gi',
  );

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const matches = keyframesRegex.exec(cssText);
    if (matches === null) {
      break;
    }
    result.push(matches[0]);
  }
  cssText = cssText.replace(keyframesRegex, '');

  const importRegex = /@import[\s\S]*?url\([^)]*\)[\s\S]*?;/gi;
  // to match css & media queries together
  const combinedCSSRegex =
    '((\\s*?(?:\\/\\*[\\s\\S]*?\\*\\/)?\\s*?@media[\\s\\S]' +
    '*?){([\\s\\S]*?)}\\s*?})|(([\\s\\S]*?){([\\s\\S]*?)})';
  // unified regex
  const unifiedRegex = new RegExp(combinedCSSRegex, 'gi');

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let matches = importRegex.exec(cssText);
    if (matches === null) {
      matches = unifiedRegex.exec(cssText);
      if (matches === null) {
        break;
      } else {
        importRegex.lastIndex = unifiedRegex.lastIndex;
      }
    } else {
      unifiedRegex.lastIndex = importRegex.lastIndex;
    }
    result.push(matches[0]);
  }

  return result;
}

export async function getCSSRules(
  styleSheets: CSSStyleSheet[],
  options: Options,
): Promise<CSSStyleRule[]> {
  const ret: CSSStyleRule[] = [];
  const deferreds: Promise<number | void>[] = [];

  // First loop inlines imports
  styleSheets.forEach(sheet => {
    if ('cssRules' in sheet) {
      try {
        toArray<CSSRule>(sheet.cssRules || []).forEach((item, index) => {
          if (item.type === CSSRule.IMPORT_RULE) {
            let importIndex = index + 1;
            const url = (item as CSSImportRule).href;
            const deferred = fetchCSS(url)
              .then(metadata => embedFonts(metadata, options))
              .then(cssText =>
                parseCSS(cssText).forEach(rule => {
                  try {
                    sheet.insertRule(
                      rule,
                      rule.startsWith('@import')
                        ? (importIndex += 1)
                        : sheet.cssRules.length,
                    );
                  } catch (error) {
                    console.error('Error inserting rule from remote css', {
                      rule,
                      error,
                    });
                  }
                }),
              )
              .catch(e => {
                console.error('Error loading remote css', e.toString());
              });

            deferreds.push(deferred);
          }
        });
      } catch (e) {
        const inline =
          styleSheets.find(a => a.href == null) || document.styleSheets[0];
        if (sheet.href != null) {
          deferreds.push(
            fetchCSS(sheet.href)
              .then(metadata => embedFonts(metadata, options))
              .then(cssText =>
                parseCSS(cssText).forEach(rule => {
                  inline.insertRule(rule, sheet.cssRules.length);
                }),
              )
              .catch(err => {
                console.error(
                  'Error loading remote stylesheet',
                  err.toString(),
                );
              }),
          );
        }
        console.error(
          'Error inlining remote css file',
          (e as Error).toString(),
        );
      }
    }
  });

  return Promise.all(deferreds).then(() => {
    // Second loop parses rules
    styleSheets.forEach(sheet => {
      if ('cssRules' in sheet) {
        try {
          toArray<CSSStyleRule>(sheet.cssRules || []).forEach(item => {
            ret.push(item);
          });
        } catch (e) {
          console.error(
            `Error while reading CSS rules from ${sheet.href}`,
            (e as Error).toString(),
          );
        }
      }
    });

    return ret;
  });
}

/**
 * Return value from `CSSStyleRule.style` property
 *
 * This method is needed to have compatibility across different browsers. In fact,
 * it seems that Firefox force to use the `.getPropertyValue()` method in order to
 * get the style value, since the property accessor doesn't work like chrome and safari
 *
 * @param cssStyleRule
 * @param property
 * @param cssProperty
 */
function getStylesheetValue<K extends keyof CSSStyleDeclaration & string>(
  cssStyleRule: CSSStyleRule,
  property: K,
  cssProperty: string,
) {
  return Reflect.has(cssStyleRule.style, property)
    ? Reflect.get(cssStyleRule.style, property)
    : cssStyleRule.style.getPropertyValue(cssProperty);
}

function getStylesheetFontValues(stylesheet: CSSStyleRule) {
  return {
    fontFamily: getStylesheetValue(stylesheet, 'fontFamily', 'font-family'),
    fontWeight: getStylesheetValue(stylesheet, 'fontWeight', 'font-weight'),
    fontStyle: getStylesheetValue(stylesheet, 'fontStyle', 'font-style'),
  };
}

export function getFontsMap(cssStyleRules: CSSStyleRule[]): FontsMap {
  const fontInfo: Record<string, Record<string, CSSStyleRule>> = {};

  for (const stylesheet of cssStyleRules) {
    const {fontFamily, fontWeight, fontStyle} =
      getStylesheetFontValues(stylesheet);

    const escapedFontFamily = getFontName(fontFamily)[0];
    if (!(fontFamily in fontInfo)) {
      fontInfo[escapedFontFamily] = {};
    }
    fontInfo[escapedFontFamily][`${fontWeight}-${fontStyle}`] = stylesheet;
  }
  return fontInfo;
}

const getFontName = (fontFamily: string) => {
  if (!fontFamily) {
    console.warn('[dom-export] Given font-family value is invalid');
    return [];
  }
  const fonts = fontFamily.split(',');
  return fonts.map(font =>
    font.trim().toLowerCase().replace(REGEXP_QUOTE_FONT_FAMILY, ''),
  );
};

const getUsedFontFamiliesRecursively = <T extends Element>(
  acc: string[],
  fontsMap: FontsMap,
  internalNode: T,
  parentFont: string | null,
): string[] => {
  const elementStyle = (internalNode as unknown as HTMLElement).style;
  const {fontFamily, fontWeight, fontStyle} = elementStyle;
  if (fontFamily) {
    parentFont = fontFamily;
  }
  if (fontFamily || fontStyle || fontWeight) {
    const computedFont = getFontName(fontFamily ?? parentFont ?? 'default')[0];
    const fontId = `${computedFont}-${fontWeight}-${fontStyle}`;
    if (!acc.includes(fontId) && !!fontsMap[computedFont]) {
      acc.push(fontId);
    }
  }

  if (internalNode.children.length === 0) {
    return acc;
  }

  for (let i = 0; i <= internalNode.children.length; i++) {
    const childNode = internalNode.children[i];
    if (childNode) {
      const fontFamilies = getUsedFontFamiliesRecursively(
        acc,
        fontsMap,
        childNode as T,
        parentFont,
      );
      acc.push(...fontFamilies.filter(id => !acc.includes(id)));
    }
  }

  return acc;
};

export function getUsedFontFamiliesByNode<T extends Element>(
  fontsMap: FontsMap,
  node: T,
  cssStyleRules: CSSStyleRule[],
): CSSStyleRule[] {
  const fontFamilies = getUsedFontFamiliesRecursively([], fontsMap, node, null);
  return cssStyleRules.reduce((acc, styleRule) => {
    const {fontFamily, fontWeight, fontStyle} =
      getStylesheetFontValues(styleRule);

    const id = `${getFontName(fontFamily)[0]}-${fontWeight}-${fontStyle}`;
    if (!fontFamilies.includes(id)) {
      return acc;
    }
    return acc.concat(styleRule);
  }, [] as CSSStyleRule[]);
}

function getWebFontRules(
  node: HTMLElement,
  cssRules: CSSStyleRule[],
  experimental_optimizeFontLoading: boolean,
): CSSStyleRule[] {
  const webFontsRules = cssRules
    .filter(rule => rule.type === CSSRule.FONT_FACE_RULE)
    .filter(rule => shouldEmbed(rule.style.getPropertyValue('src')));

  if (!experimental_optimizeFontLoading) {
    return webFontsRules;
  }
  const fontsMap = getFontsMap(webFontsRules);
  return getUsedFontFamiliesByNode(fontsMap, node, webFontsRules);
}

async function parseWebFontRules<T extends HTMLElement>(
  node: T,
  options: Options,
) {
  if (node.ownerDocument == null) {
    throw new Error('Provided element is not within a Document');
  }

  const styleSheets = toArray<CSSStyleSheet>(node.ownerDocument.styleSheets);
  const cssRules = await getCSSRules(styleSheets, options);

  return getWebFontRules(
    node,
    cssRules,
    options.experimental_optimizeFontLoading ?? false,
  );
}

export async function getWebFontCSS<T extends HTMLElement>(
  node: T,
  options: Options,
): Promise<string> {
  const cacheUrls = new Set<string>();
  const rules = await parseWebFontRules(node, options);
  const cssTexts = await Promise.all(
    rules.map(rule => {
      const baseUrl = rule.parentStyleSheet ? rule.parentStyleSheet.href : null;
      return embedResources(rule.cssText, baseUrl, {...options, cacheUrls});
    }),
  );

  return cssTexts.join('\n');
}

export async function embedWebFonts<T extends HTMLElement>(
  clonedNode: T,
  options: Options,
) {
  const cssText =
    options.fontEmbedCSS != null
      ? options.fontEmbedCSS
      : options.skipFonts
      ? null
      : await getWebFontCSS(clonedNode, options);

  if (cssText) {
    const styleNode = document.createElement('style');
    const sytleContent = document.createTextNode(cssText);

    styleNode.appendChild(sytleContent);

    if (clonedNode.firstChild) {
      clonedNode.insertBefore(styleNode, clonedNode.firstChild);
    } else {
      clonedNode.appendChild(styleNode);
    }
  }
}
