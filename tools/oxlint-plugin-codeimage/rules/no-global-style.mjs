export const noGlobalStyle = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'A vanilla-extract style targets its own class, not a selector assembled with globalStyle.',
    },
    schema: [],
    messages: {
      global:
        'Give the element its own style() class. For a state of a parent, add selectors: {[`${parent}[data-state] &`]: {...}} to the child style. For variants use styleVariants or recipe. globalStyle is for document-wide rules in theme/global.css.ts.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'globalStyle'
        ) {
          context.report({node, messageId: 'global'});
        }
      },
    };
  },
};
