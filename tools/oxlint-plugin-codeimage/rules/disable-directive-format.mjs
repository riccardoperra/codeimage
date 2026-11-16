const DISABLE = /^\s*(oxlint|eslint)-disable(-next-line|-line)?\b/;
const FORMAT = /\s--\s.*\S.*\bexpires (\d{4}-\d{2}-\d{2})\b.*\bapproved by \S+/;

export const disableDirectiveFormat = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'A lint exception states its reason, its expiry date and who approved it.',
    },
    schema: [],
    messages: {
      format:
        'Write the exception as "oxlint-disable-next-line <rule> -- <reason>, expires YYYY-MM-DD, approved by <name>". The operator approves it in review.',
      expired:
        'This exception expired on {{date}}. Fix the code it covers or ask the operator for a new date.',
    },
  },
  create(context) {
    return {
      Program() {
        const today = new Date().toISOString().slice(0, 10);
        for (const comment of context.sourceCode.getAllComments()) {
          if (!DISABLE.test(comment.value)) continue;
          const match = FORMAT.exec(comment.value);
          if (!match) {
            context.report({loc: comment.loc, messageId: 'format'});
          } else if (match[1] < today) {
            context.report({
              loc: comment.loc,
              messageId: 'expired',
              data: {date: match[1]},
            });
          }
        }
      },
    };
  },
};
