function isStaticStyleValue(node) {
  if (node.type === 'Literal') return true;
  return node.type === 'TemplateLiteral' && node.expressions.length === 0;
}

export const noStaticInlineStyle = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Static styles live in a vanilla-extract .css.ts file.',
    },
    schema: [],
    messages: {
      inline:
        'Move these constant declarations to the component .css.ts file (vanilla-extract, tokens from @codeimage/ui). The style prop is for values computed at runtime.',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'style') {
          return;
        }
        const value = node.value;
        if (!value) return;
        if (value.type === 'Literal') {
          context.report({node, messageId: 'inline'});
          return;
        }
        if (
          value.type !== 'JSXExpressionContainer' ||
          value.expression.type !== 'ObjectExpression'
        ) {
          return;
        }
        const properties = value.expression.properties;
        if (properties.length === 0) return;
        const allStatic = properties.every(
          property =>
            property.type === 'Property' &&
            !property.computed &&
            isStaticStyleValue(property.value),
        );
        if (allStatic) context.report({node, messageId: 'inline'});
      },
    };
  },
};
