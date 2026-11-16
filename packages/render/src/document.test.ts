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
  it.each(['card', 'editor', 'shell', 'terminal', 'future', null])(
    'normalizes window %s',
    type => {
      const parsed = parseSnapshotDocument({
        ...sampleDocument,
        terminal: {
          ...sampleDocument.terminal,
          type,
          surface: 'wash',
          borderType: 'hairline',
        },
      });
      let expected = 'macOs';
      if (type === 'terminal') expected = 'shell';
      else if (['card', 'editor', 'shell'].includes(type ?? ''))
        expected = type ?? 'macOs';
      expect(parsed.terminal.type).toBe(expected);
      expect(parsed.terminal.surface).toBe('wash');
      expect(parsed.terminal.borderType).toBe('hairline');
    },
  );
  it.each([undefined, null, 'future'])('defaults surface %s', surface => {
    expect(
      parseSnapshotDocument({
        ...sampleDocument,
        terminal: {...sampleDocument.terminal, surface},
      }).terminal.surface,
    ).toBe('solid');
  });
  it('defaults omitted appearance fields in older snapshots', () => {
    const {signature, ...frame} = sampleDocument.frame;
    const {surface, type, ...terminal} = sampleDocument.terminal;
    expect(
      parseSnapshotDocument({...sampleDocument, frame, terminal}),
    ).toMatchObject({
      frame: {signature: null},
      terminal: {type: 'macOs', surface: 'solid'},
    });
  });
  it('parses signatures with app defaults and is idempotent', () => {
    const parsed = parseSnapshotDocument({
      ...sampleDocument,
      frame: {
        ...sampleDocument.frame,
        signature: {
          handle: 'octocat',
          position: 'bottom-center',
          style: 'card',
          platform: 'github',
          name: 'The Octocat',
          avatar: 'profile',
          profile: 'github.com/octocat',
          savedId: 'one',
        },
      },
    });
    expect(parsed.frame.signature).toMatchObject({
      style: 'card',
      position: 'bottom-center',
      name: 'The Octocat',
    });
    expect(parseSnapshotDocument(parsed)).toEqual(parsed);
    expect(
      parseSnapshotDocument({
        ...sampleDocument,
        frame: {
          ...sampleDocument.frame,
          signature: {handle: 'me', style: 'future'},
        },
      }).frame.signature,
    ).toMatchObject({style: 'minimal', position: 'bottom-right'});
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
  const step = (editorId: string, holdMs: number, id = editorId) => ({
    id,
    editorId,
    holdMs,
  });
  const header = {mode: 'tab', title: ''};

  it('makes every tab a step in tab order when the project stores no animation', () => {
    expect(parseAnimationDocument(project)).toMatchObject({
      format: 'webp',
      scale: 2,
      animation: {
        steps: [step('a', 800), step('b', 800), step('c', 800)],
        transitionMs: 700,
        easing: 'smooth',
        fps: 30,
        header,
      },
    });
  });
  it('keeps the steps, transitions, easing and header the editor saves', () => {
    const stored = {
      steps: [
        step('c', 100),
        {
          ...step('a', 0, 'a-2'),
          transition: {ms: 1200, easing: 'cubic-bezier(0.1, 0.2, 0.3, 1)'},
        },
        {...step('c', 250, 'c~2'), transition: {ms: 300, easing: 'strong'}},
      ],
      transitionMs: 400,
      easing: 'snappy',
      fps: 60,
      header: {mode: 'title', title: 'A story'},
    };
    expect(
      parseAnimationDocument({...project, animation: stored}).animation,
    ).toEqual(stored);
  });
  it('reads a project saved before step ids and headers', () => {
    expect(
      parseAnimationDocument({
        ...project,
        animation: {
          steps: [
            {editorId: 'b', holdMs: 100},
            {editorId: 'b', holdMs: 200},
          ],
          transitionMs: 900,
          easing: 'linear',
          fps: 24,
        },
      }).animation,
    ).toEqual({
      steps: [step('b', 100), step('b', 200, 'b~2')],
      transitionMs: 900,
      easing: 'linear',
      fps: 24,
      header,
    });
  });
  it('clamps and rounds durations as the editor does', () => {
    const {steps, transitionMs} = parseAnimationDocument({
      ...project,
      animation: {
        steps: [
          step('a', 100.5),
          {...step('b', 20_000), transition: {ms: 33.3, easing: 'linear'}},
        ],
        transitionMs: 9000,
      },
    }).animation;
    expect([
      steps.map(step => [step.holdMs, step.transition?.ms]),
      transitionMs,
    ]).toEqual([
      [
        [101, undefined],
        [10_000, 100],
      ],
      5000,
    ]);
  });
  it('holds a lone step whose hold is 0 ms for the default hold', () => {
    expect(
      parseAnimationDocument({
        ...project,
        animation: {steps: [step('a', 0)]},
      }).animation.steps,
    ).toEqual([step('a', 800)]);
  });
  it('drops a step whose tab is gone', () => {
    expect(
      parseAnimationDocument({
        ...project,
        animation: {steps: [step('a', 100), step('gone', 100)]},
      }).animation.steps,
    ).toEqual([step('a', 100)]);
  });
  it.each([
    [{transitionMs: -1}, {transitionMs: 100}],
    [{easing: 'bounce'}, {easing: 'smooth'}],
    [{easing: '0.65, 0, 0.35, 1'}, {easing: 'smooth'}],
    [{fps: 25}, {fps: 30}],
    [{header: {mode: 'all', title: 3}}, {header}],
  ])('reads invalid settings %j as the editor does', (settings, expected) => {
    expect(
      parseAnimationDocument({
        ...project,
        animation: {steps: [step('a', 100), step('b', 100)], ...settings},
      }).animation,
    ).toMatchObject(expected);
  });
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
