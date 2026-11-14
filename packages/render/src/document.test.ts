import {describe, expect, it} from 'vitest';
import {parseAnimationDocument, parseSnapshotDocument} from './document';
import {sampleDocument} from './sample';

describe('parseSnapshotDocument', () => {
  it('parses a saved project and defaults export settings', () => {
    const {format, scale, ...project} = sampleDocument;
    expect(parseSnapshotDocument(project)).toEqual({
      ...project,
      format: 'png',
      scale: 2,
    });
    expect(parseSnapshotDocument(project).width).toBeUndefined();
  });
  it.each(['0.8.0', '1.9.0', '1.10.1', '1.99.0', '1.11.0-rc.1'])(
    'accepts compatible version %s',
    $version => {
      expect(
        parseSnapshotDocument({...sampleDocument, $version}).$version,
      ).toBe($version);
    },
  );
  it('preserves future fields at every snapshot level', () => {
    const document = {
      ...sampleDocument,
      metadata: {label: 'future'},
      frame: {
        ...sampleDocument.frame,
        futureSignature: 'name',
        target: 'square',
      },
      terminal: {...sampleDocument.terminal, future: true},
      editor: {
        ...sampleDocument.editor,
        future: true,
        options: {...sampleDocument.editor.options, future: true},
        editors: sampleDocument.editor.editors.map(editor => ({
          ...editor,
          futureMarks: [{line: 1, kind: 'added'}],
        })),
      },
    };
    expect(parseSnapshotDocument(document)).toEqual(document);
  });
  it.each([
    {marks: {lines: [{line: 2, kind: 'highlight'}]}, focusedLines: []},
    {
      marks: {lines: [{line: 2, kind: 'highlight'}], focusedLines: [1, 3]},
      focusedLines: [1, 3],
    },
  ])('reads focused lines from $marks', ({marks, focusedLines}) => {
    const document = parseSnapshotDocument({
      ...sampleDocument,
      editor: {
        ...sampleDocument.editor,
        editors: [{...sampleDocument.editor.editors[0], marks}],
      },
    });
    expect(document.editor.editors[0].marks).toMatchObject({
      lines: marks.lines,
      focusedLines,
    });
  });
  it('rejects malformed focused line numbers', () => {
    expect(() =>
      parseSnapshotDocument({
        ...sampleDocument,
        editor: {
          ...sampleDocument.editor,
          editors: [
            {
              ...sampleDocument.editor.editors[0],
              marks: {lines: [], focusedLines: [0]},
            },
          ],
        },
      }),
    ).toThrow('marks.focusedLines');
  });
  it('requires an editor', () => {
    const {editor, ...project} = sampleDocument;
    expect(() => parseSnapshotDocument(project)).toThrow();
    expect(() =>
      parseSnapshotDocument({...project, editor: {...editor, editors: []}}),
    ).toThrow('at least one editor');
  });
  it.each([999, '999', '2.0.0'])(
    'names an unsupported version %s',
    $version => {
      expect(() =>
        parseSnapshotDocument({...sampleDocument, $version}),
      ).toThrow(`Unsupported snapshot $version ${JSON.stringify($version)}`);
    },
  );
  it.each([{scale: 0}, {width: -1}, {format: 'gif'}])(
    'rejects invalid export options %s',
    options => {
      expect(() =>
        parseSnapshotDocument({...sampleDocument, ...options}),
      ).toThrow();
    },
  );
});

describe('parseAnimationDocument', () => {
  const [tab] = sampleDocument.editor.editors;
  const {format, ...project} = {
    ...sampleDocument,
    editor: {
      ...sampleDocument.editor,
      editors: [
        {...tab, id: 'a'},
        {...tab, id: 'b'},
        {...tab, id: 'c'},
      ],
    },
  };
  const animation = (
    holds: number[],
    transitionMs: number,
    ids = ['a', 'b', 'c'],
  ) => ({
    steps: holds.map((holdMs, index) => ({editorId: ids[index], holdMs})),
    transitionMs,
    easing: 'snappy',
    fps: 60,
  });

  it('makes every tab a step in tab order when the project stores no animation', () => {
    expect(parseAnimationDocument(project)).toMatchObject({
      format: 'webp',
      scale: 2,
      animation: {
        steps: [
          {editorId: 'a', holdMs: 800},
          {editorId: 'b', holdMs: 800},
          {editorId: 'c', holdMs: 800},
        ],
        transitionMs: 900,
        easing: 'smooth',
        fps: 30,
      },
    });
  });
  it('keeps the steps and the timing the project stores', () => {
    const stored = animation([100, 0, 250], 400, ['c', 'a', 'c']);
    expect(
      parseAnimationDocument({...project, animation: stored}).animation,
    ).toEqual(stored);
  });
  it('rounds durations to whole milliseconds', () => {
    const {steps, transitionMs} = parseAnimationDocument({
      ...project,
      animation: animation([100.5, 0.4], 33.3),
    }).animation;
    expect([steps.map(step => step.holdMs), transitionMs]).toEqual([
      [101, 0],
      33,
    ]);
  });
  it.each([
    ['one step held for 0 ms', animation([0], 900)],
    ['holds and a transition of 0 ms', animation([0, 0], 0)],
    ['durations that round to 0 ms', animation([0.4, 0.2], 0.3)],
  ])('rejects %s', (_, stored) => {
    expect(() =>
      parseAnimationDocument({...project, animation: stored}),
    ).toThrow('animation: The holds and transitions add up to 0 ms');
  });
  it('accepts holds of 0 ms between transitions', () => {
    expect(
      parseAnimationDocument({...project, animation: animation([0, 0], 300)})
        .animation.transitionMs,
    ).toBe(300);
  });
  it('names a step whose tab is gone', () => {
    expect(() =>
      parseAnimationDocument({
        ...project,
        animation: animation([100, 100], 300, ['a', 'gone']),
      }),
    ).toThrow('animation.steps.1.editorId: The snapshot has no tab "gone"');
  });
  it.each([{steps: []}, {transitionMs: -1}, {easing: 'bounce'}, {fps: 25}])(
    'rejects invalid settings %s',
    settings => {
      expect(() =>
        parseAnimationDocument({
          ...project,
          animation: {...animation([100, 100], 300), ...settings},
        }),
      ).toThrow('animation');
    },
  );
  it.each(['png', 'svg', 'mp4'])('rejects the format %s', format => {
    expect(() => parseAnimationDocument({...project, format})).toThrow(
      'format',
    );
  });
  it('renders a named target at its exact pixel size', () => {
    expect(
      parseAnimationDocument({
        ...project,
        scale: 3,
        frame: {...project.frame, exportTarget: 'square'},
      }).scale,
    ).toBe(1);
  });
});
