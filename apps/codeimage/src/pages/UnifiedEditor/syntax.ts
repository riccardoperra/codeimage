import type {CustomTheme} from '@codeimage/highlight';
import {highlightingFor} from '@codemirror/language';
import {EditorState} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import type {Tag} from '@lezer/highlight';
import {tags} from '@lezer/highlight';

export interface SyntaxColors {
  /** Text with no token colour, the editor's own `color`. */
  readonly base: string;
  readonly keyword: string;
  readonly string: string;
  readonly function: string;
  readonly number: string;
  readonly comment: string;
  readonly type: string;
  readonly property: string;
}

const TOKEN_TAGS: Record<Exclude<keyof SyntaxColors, 'base'>, Tag> = {
  keyword: tags.keyword,
  string: tags.string,
  function: tags.function(tags.variableName),
  number: tags.number,
  comment: tags.lineComment,
  type: tags.typeName,
  property: tags.definition(tags.propertyName),
};

const RULE = /([^{}]+)\{([^}]*)\}/g;
const COLOR = /(?:^|[;\s])color\s*:\s*([^;]+)/;

/** Maps each single-class selector to its `color`, one map per module in precedence order. */
function colorsByClass(state: EditorState): Map<string, string>[] {
  return state.facet(EditorView.styleModule).map(module => {
    const colors = new Map<string, string>();
    for (const [, selector, body] of module.getRules().matchAll(RULE)) {
      const single = /^\s*\.([^\s.,:>+~[]+)\s*$/.exec(selector);
      const color = COLOR.exec(body)?.[1].trim();
      if (single && color) colors.set(single[1], color);
    }
    return colors;
  });
}

const cache = new WeakMap<CustomTheme, SyntaxColors>();

export function readSyntaxColors(theme: CustomTheme): SyntaxColors {
  let colors = cache.get(theme);
  if (!colors) {
    colors = resolveSyntaxColors(theme);
    cache.set(theme, colors);
  }
  return colors;
}

// The theme objects keep only CodeMirror extensions, not the colour map the
// themes were defined from. This reads the colours back the way CodeMirror
// applies them: the classes a highlighter assigns to a tag, then the colour
// the highest-precedence style module gives those classes. A token with no
// rule renders in the base colour, so it gets the base colour.
function resolveSyntaxColors(theme: CustomTheme): SyntaxColors {
  const state = EditorState.create({extensions: theme.editorTheme});
  const modules = colorsByClass(state);
  const colorOf = (classes: readonly string[]) => {
    for (const module of modules) {
      for (const name of classes) {
        const color = module.get(name);
        if (color) return color;
      }
    }
    return undefined;
  };

  const view = new EditorView({state});
  const themeClasses = view.themeClasses.split(' ');
  view.destroy();
  const base = colorOf(themeClasses) ?? theme.properties.terminal.text;

  const tokenColor = (tag: Tag) =>
    colorOf(highlightingFor(state, [tag])?.split(' ') ?? []) ?? base;

  return {
    base,
    keyword: tokenColor(TOKEN_TAGS.keyword),
    string: tokenColor(TOKEN_TAGS.string),
    function: tokenColor(TOKEN_TAGS.function),
    number: tokenColor(TOKEN_TAGS.number),
    comment: tokenColor(TOKEN_TAGS.comment),
    type: tokenColor(TOKEN_TAGS.type),
    property: tokenColor(TOKEN_TAGS.property),
  };
}
