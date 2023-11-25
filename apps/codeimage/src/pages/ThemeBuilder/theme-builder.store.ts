import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {createEffect, getOwner, on, onMount, runWithOwner} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {defineStore} from 'statebuilder';

/**
 * comment
 * token
 * variable
 * type
 * tags
 * propertyName
 * className
 * string
 * boolean
 * keyword
 * operator
 * Punctuation
 * attributeName
 */
export function getDefaultTagsState() {
  return {
    // Comments
    comment: null,
    lineComment: null,
    blockComment: null,
    docComment: null,

    // Token
    name: null,

    // Variable
    variableName: null,
    variableNameDefinition: null, // definition (variableName),
    variableNameFunction: null, // function (variableName),

    // Type
    typeName: null,
    typeNameStandard: null, // standard typename,

    // Tags
    tagName: null,
    tagNameStandard: null, // standard tagName,

    // PropertyName
    propertyName: null,
    propertyNameDefinition: null, // definition (variableName),
    propertyNameFunction: null, // function (variableName),
    propertyNameSpecial: null, // special (variableName),

    attributeName: null,

    className: null,
    classNameConstant: null, // constant(className)

    labelName: null,
    namespace: null,
    macroName: null,

    // String
    literal: null,
    string: null,
    stringSpecial: null, // special(string)
    docString: null,
    character: null,

    // Special Strings
    regexp: null,
    escape: null,
    color: null,
    url: null,

    attributeValue: null,

    // Numbers
    number: null,
    integer: null,
    float: null,

    // Boolean
    bool: null,

    // Keywords
    keyword: null,
    self: null, // this
    null: null,
    atom: null,
    unit: null,
    modifier: null,
    operatorKeyword: null,
    controlKeyword: null,
    definitionKeyword: null,
    moduleKeyword: null,

    // Operators
    operator: null,
    derefOperator: null,
    arithmeticOperator: null,
    logicOperator: null,
    bitwiseOperator: null,
    compareOperator: null,
    updateOperator: null,
    definitionOperator: null,
    typeOperator: null,
    controlOperator: null,

    // Punctuation
    punctuation: null,
    separator: null,
    bracket: null,
    angleBracket: null,
    squareBracket: null,
    paren: null,
    brace: null,
    content: null,

    // Markdown
    heading: null,
    heading1: null,
    heading2: null,
    heading3: null,
    heading4: null,
    heading5: null,
    heading6: null,
    contentSeparator: null,
    list: null,
    quote: null,
    emphasis: null,
    strong: null,
    link: null,
    monospace: null,
    strikethrough: null,

    inserted: null,
    deleted: null,
    changed: null,
    invalid: null,
    meta: null,
    documentMeta: null,
    annotation: null,
    processingInstruction: null,
  };
}

export function getDefaultEditorState() {
  return {
    background: null,
    foreground: null,
  };
}

export const ThemeBuilderStore = defineStore(() => ({
  editor: getDefaultEditorState(),
  syntax: getDefaultTagsState(),
}))
  .extend(withIndexedDbPlugin('theme-builder', {} as any))
  .extend(_ => {
    const owner = getOwner();
    onMount(() => {
      _.idb.get().then(initialState => {
        if (initialState) {
          _.set(initialState);
        }
      });
      runWithOwner(owner, () => {
        createEffect(
          on(
            _,
            data => {
              _.idb.update(() => unwrap(data));
            },
            {defer: true},
          ),
        );
      });
    });
  });
