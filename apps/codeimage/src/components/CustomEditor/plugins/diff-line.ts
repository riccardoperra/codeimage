import {RangeSetBuilder} from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';

const addDecoration = Decoration.line({
  attributes: {class: 'cm-add-line'},
});

const removeDecoration = Decoration.line({
  attributes: {class: 'cm-remove-line'},
});

function decorationBuilder(view: EditorView) {
  const builder = new RangeSetBuilder<Decoration>();
  view.visibleRanges.forEach(({from, to}) => {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      if (line.text.startsWith('+')) {
        builder.add(line.from, line.from, addDecoration);
      }
      if (line.text.startsWith('-')) {
        builder.add(line.from, line.from, removeDecoration);
      }
      pos = line.to + 1;
    }
  });
  return builder.finish();
}

export const showDiffLines = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = decorationBuilder(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = decorationBuilder(update.view);
      }
    }
  },
  {
    decorations: ({decorations}) => decorations,
  },
);
