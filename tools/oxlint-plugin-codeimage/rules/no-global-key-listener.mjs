const GLOBAL_KEY_TARGETS = new Set(['window', 'document', 'globalThis']);
const KEY_EVENTS = new Set(['keydown', 'keyup', 'keypress']);

function isGlobalKeyTarget(node) {
  if (node.type === 'Identifier') return GLOBAL_KEY_TARGETS.has(node.name);
  return (
    node.type === 'MemberExpression' &&
    node.object.type === 'Identifier' &&
    node.object.name === 'document' &&
    node.property.type === 'Identifier' &&
    (node.property.name === 'body' || node.property.name === 'documentElement')
  );
}

export const noGlobalKeyListener = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'App-wide keys go through useHotkey so they share one focus check.',
    },
    schema: [],
    messages: {
      listener:
        'Register app-wide keys with useHotkey from src/hooks/use-hotkey.ts and guard them with isKeyOwnedByFocus. A raw {{target}} listener fires while the user types in a field.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const callee = node.callee;
        if (
          callee.type !== 'MemberExpression' ||
          callee.property.type !== 'Identifier' ||
          callee.property.name !== 'addEventListener' ||
          !isGlobalKeyTarget(callee.object)
        ) {
          return;
        }
        const [eventName] = node.arguments;
        if (
          eventName?.type !== 'Literal' ||
          typeof eventName.value !== 'string' ||
          !KEY_EVENTS.has(eventName.value)
        ) {
          return;
        }
        context.report({
          node,
          messageId: 'listener',
          data: {target: context.sourceCode.getText(callee.object)},
        });
      },
    };
  },
};
