import {
  detectSecrets,
  redactSecrets,
  type SecretMatch,
  type SecretRuleId,
} from '@codeimage/secrets';
import {isolateHistory} from '@codemirror/commands';
import {forceLinting, linter} from '@codemirror/lint';
import {StateEffect} from '@codemirror/state';
import {EditorView} from '@codemirror/view';
import {getWhatsNew} from '@codeimage/store/whats-new';

export interface SecretMessages {
  warning(ruleId: SecretRuleId): string;
  redact: string;
  ignore: string;
}

export function redactInEditor(
  view: EditorView,
  matches = detectSecrets(view.state.doc.toString()),
) {
  if (view.state.readOnly || !matches.length) return;
  const text = view.state.doc.toString();
  view.dispatch({
    changes: matches.map(match => ({
      from: match.from + match.keepPrefix,
      to: match.to,
      insert: text
        .slice(match.from + match.keepPrefix, match.to)
        .replace(/[^\r\n]/g, '•'),
    })),
    annotations: isolateHistory.of('full'),
    userEvent: 'input.redact',
  });
}

export function redactTabCode(code: string, view?: EditorView): string {
  if (view && view.state.doc.toString() === code) {
    redactInEditor(view);
    return view.state.doc.toString();
  }
  return redactSecrets(code);
}

export function createSecretsExtension(
  messages: () => SecretMessages,
  documentId: () => string,
) {
  const ignoredByDocument = new Map<string, SecretMatch[]>();
  let previousDocumentId = documentId();
  const ignored = () => ignoredByDocument.get(documentId()) ?? [];
  const refresh = StateEffect.define<null>();
  const extension = [
    EditorView.updateListener.of(update => {
      if (!update.docChanged) return;
      const id = documentId();
      if (id !== previousDocumentId) {
        previousDocumentId = id;
        return;
      }
      ignoredByDocument.set(
        id,
        ignored().flatMap(match => {
          if (update.changes.touchesRange(match.from, match.to)) return [];
          return [
            {
              ...match,
              from: update.changes.mapPos(match.from, 1),
              to: update.changes.mapPos(match.to, -1),
            },
          ];
        }),
      );
    }),
    linter(
      view =>
        detectSecrets(view.state.doc.toString())
          .filter(
            match =>
              !ignored().some(
                item =>
                  item.from === match.from &&
                  item.to === match.to &&
                  item.ruleId === match.ruleId,
              ),
          )
          .map(match => ({
            from: match.from,
            to: match.to,
            severity: 'warning',
            message: messages().warning(match.ruleId),
            actions: [
              {
                name: messages().redact,
                apply(view, from, to) {
                  const current = detectSecrets(view.state.doc.toString()).find(
                    item => item.from === from && item.to === to,
                  );
                  if (!current) return;
                  redactInEditor(view, [current]);
                  getWhatsNew().seen('redact');
                },
              },
              {
                name: messages().ignore,
                apply(view, from, to) {
                  ignoredByDocument.set(documentId(), [
                    ...ignored(),
                    {...match, from, to},
                  ]);
                  view.dispatch({effects: refresh.of(null)});
                  forceLinting(view);
                },
              },
            ],
          })),
      {
        delay: 200,
        needsRefresh: update =>
          update.transactions.some(transaction =>
            transaction.effects.some(effect => effect.is(refresh)),
          ),
      },
    ),
  ];
  return {
    extension,
    refresh(view: EditorView) {
      view.dispatch({effects: refresh.of(null)});
      forceLinting(view);
    },
  };
}
