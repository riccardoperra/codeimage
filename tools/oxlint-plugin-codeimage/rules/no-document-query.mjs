const DOCUMENT_QUERIES = new Set([
  'querySelector',
  'querySelectorAll',
  'getElementById',
  'getElementsByClassName',
  'getElementsByTagName',
]);

export const noDocumentQuery = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Components reach their own elements through refs.',
    },
    schema: [],
    messages: {
      query:
        'Reach the element through a ref, a prop or a store. document.{{method}} couples this module to markup owned by another component.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== 'MemberExpression' ||
          callee.object.type !== 'Identifier' ||
          callee.object.name !== 'document' ||
          callee.property.type !== 'Identifier' ||
          !DOCUMENT_QUERIES.has(callee.property.name)
        ) {
          return;
        }
        context.report({
          node,
          messageId: 'query',
          data: {method: callee.property.name},
        });
      },
    };
  },
};
