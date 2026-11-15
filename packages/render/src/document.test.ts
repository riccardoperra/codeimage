import {describe, expect, it} from 'vitest';
import {parseSnapshotDocument} from './document';
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
      expect(parsed.terminal.type).toBe(
        type === 'terminal'
          ? 'shell'
          : ['card', 'editor', 'shell'].includes(type ?? '')
            ? type
            : 'macOs',
      );
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
