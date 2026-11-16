const DIRECTIVE_COMMENT =
  /^\s*(oxlint-|eslint-|@ts-expect-error|@ts-ignore|@ts-nocheck|@vite-ignore|@refresh\b|@jsxImportSource\b|[#@]__(PURE|NO_SIDE_EFFECTS)__|\/\s*<reference\b|v8 ignore|c8 ignore|istanbul ignore|oxfmt-ignore|prettier-ignore|webpackChunkName)/;

export const noComments = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Code carries no explanatory comments; the rationale lives in the commit or PR body.',
    },
    schema: [],
    messages: {
      comment:
        'Remove this comment. Name the code so it reads on its own and put the rationale in the commit message or the PR body.',
    },
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          if (comment.type === 'Shebang') continue;
          if (DIRECTIVE_COMMENT.test(comment.value)) continue;
          context.report({loc: comment.loc, messageId: 'comment'});
        }
      },
    };
  },
};
