import {describe, expect, it} from 'vitest';
import {toCliConfig} from '../../../apps/codeimage/src/components/Presets/cliConfig';
import {parseArgs, UsageError} from './args';
import {snapshotDocumentSchema} from '@codeimage/render';
import {buildSnapshot, parsePreset} from './snapshot';

function renderArgs(argv: string[] = []) {
  const args = parseArgs(argv);
  if (args.kind !== 'render') throw new Error('Expected render arguments');
  return args;
}

describe('arguments', () => {
  it('accepts files, overrides, stdout, and fractional scale', () => {
    expect(
      renderArgs([
        'a.ts',
        'b.py',
        '--lang',
        'rust',
        '--lines',
        '10-30',
        '--theme',
        'dracula',
        '--preset',
        'preset.json',
        '--format',
        'svg',
        '--scale',
        '1.5',
        '-o',
        '-',
      ]),
    ).toMatchObject({
      files: ['a.ts', 'b.py'],
      language: 'rust',
      lines: {start: 10, end: 30},
      theme: 'dracula',
      preset: 'preset.json',
      format: 'svg',
      scale: 1.5,
      output: '-',
    });
  });

  it('uses png and scale 1 by default', () => {
    expect(renderArgs()).toMatchObject({
      files: [],
      format: 'png',
      scale: 1,
      output: 'codeimage.png',
    });
    expect(renderArgs(['--format=webp']).output).toBe('codeimage.webp');
  });

  it('infers the format from the output extension unless --format is given', () => {
    expect(renderArgs(['-o', 'a.svg']).format).toBe('svg');
    expect(renderArgs(['-o', 'a.JPG']).format).toBe('jpeg');
    expect(renderArgs(['-o', 'a.out']).format).toBe('png');
    expect(renderArgs(['-o', 'a.svg', '--format', 'webp']).format).toBe('webp');
  });

  it('accepts -- before filenames starting with a dash', () => {
    expect(renderArgs(['--', '--example.ts']).files).toEqual(['--example.ts']);
  });

  it('shows help without input', () => {
    expect(parseArgs(['--help'])).toEqual({kind: 'help'});
  });

  it.each(['0-5', '9-2', '-1-2', '1', '1.5-3', '1-2-3', '1-9007199254740992'])(
    'rejects invalid line range %s',
    lines => {
      expect(() => renderArgs([`--lines=${lines}`])).toThrow('--lines');
    },
  );

  it.each(['0', '-1', 'NaN', 'Infinity', '', '3.5'])(
    'rejects invalid scale %s',
    scale => {
      expect(() => renderArgs([`--scale=${scale}`])).toThrow('--scale');
    },
  );

  it('lists valid theme ids on an unknown theme', () => {
    expect(() => renderArgs(['--theme', 'nope'])).toThrow(
      /--theme.*Valid ids:.*fleetDark.*dracula/,
    );
  });

  it.each([
    ['--lang', 'nope'],
    ['--format', 'gif'],
    ['--preset'],
    ['--lines'],
    ['--scale'],
    ['-o'],
    ['--bogus'],
  ])('names invalid or missing %s on errors', (flag, value?: string) => {
    expect(() => renderArgs(value ? [flag, value] : [flag])).toThrow(flag);
  });

  it('rejects duplicate stdin inputs', () => {
    expect(() => renderArgs(['-', '-'])).toThrow(UsageError);
  });
});

describe('snapshot', () => {
  it.each([
    ['foo.ts', 'typescript'],
    ['foo.py', 'python'],
    ['README.md', 'markdown'],
    ['foo.TSX', 'typescript'],
    ['unknown.ext', 'plain-text'],
  ])('infers %s as %s from config', async (file, language) => {
    const snapshot = await buildSnapshot({
      args: renderArgs(),
      inputs: [{name: file, code: ''}],
    });
    expect(snapshot.editor.editors[0].languageId).toBe(language);
  });

  it('rejects missing input', async () => {
    await expect(
      buildSnapshot({args: renderArgs(), inputs: []}),
    ).rejects.toThrow('input:');
  });

  it('matches web defaults and makes one tab per input file', async () => {
    const snapshot = await buildSnapshot({
      args: renderArgs(),
      inputs: [
        {name: 'src/a.ts', code: 'const a = 1;'},
        {name: 'b.py', code: 'print(1)'},
      ],
    });
    expect(snapshotDocumentSchema.parse(snapshot)).toEqual(snapshot);
    expect(snapshot).toMatchObject({
      $version: '1.0.0',
      format: 'png',
      scale: 1,
      frame: {padding: 64, radius: 8, visible: true, opacity: 100},
      terminal: {
        type: 'macOs',
        showHeader: true,
        showWatermark: true,
        borderType: 'glass',
      },
      editor: {
        options: {
          fontId: 'jetbrains-mono',
          fontWeight: 400,
          showLineNumbers: false,
          themeId: 'fleetDark',
          enableLigatures: true,
        },
      },
    });
    expect(snapshot.editor.editors).toMatchObject([
      {
        tabName: 'a.ts',
        languageId: 'typescript',
        code: 'const a = 1;',
        lineNumberStart: 1,
      },
      {
        tabName: 'b.py',
        languageId: 'python',
        code: 'print(1)',
        lineNumberStart: 1,
      },
    ]);
    expect(new Set(snapshot.editor.editors.map(tab => tab.id)).size).toBe(2);
  });

  it('slices inclusive CRLF lines and starts the visible gutter at the first line', async () => {
    const snapshot = await buildSnapshot({
      args: renderArgs(['--lines', '5-12', '--lang', 'python']),
      inputs: [
        {
          name: 'a.ts',
          code:
            Array.from({length: 20}, (_, i) => `line ${i + 1}`).join('\r\n') +
            '\r\n',
        },
      ],
    });
    expect(snapshot.editor.editors[0]).toMatchObject({
      lineNumberStart: 5,
      languageId: 'python',
      code: Array.from({length: 8}, (_, i) => `line ${i + 5}`).join('\n'),
    });
    expect(snapshot.editor.options.showLineNumbers).toBe(true);
  });

  it('rejects a range starting past EOF and clamps its end to EOF', async () => {
    const inputs = [{name: 'a.ts', code: 'one\ntwo\n'}];
    await expect(
      buildSnapshot({args: renderArgs(['--lines', '3-4']), inputs}),
    ).rejects.toThrow('--lines');
    const snapshot = await buildSnapshot({
      args: renderArgs(['--lines', '2-5']),
      inputs,
    });
    expect(snapshot.editor.editors[0].code).toBe('two');
  });

  it('reads what Copy as CLI config writes and gives flags precedence', async () => {
    const webPreset = {
      appVersion: '1.10.0',
      localSyncId: 'local-1',
      frame: {
        background: '#ff0000',
        padding: 32,
        radius: 0,
        visible: true,
        opacity: 50,
        signature: {handle: '@me', position: 'bottom-right' as const},
      },
      terminal: {
        showHeader: true,
        type: 'windows',
        accentVisible: false,
        shadow: null,
        background: '#111111',
        textColor: '#eeeeee',
        showWatermark: false,
        showGlassReflection: true,
        opacity: 80,
        alternativeTheme: true,
        borderType: null,
      },
      editor: {
        fontId: 'fira-code',
        fontWeight: 700,
        showLineNumbers: true,
        themeId: 'dracula',
        enableLigatures: false,
      },
    };
    const inputs = [{name: 'a.ts', code: 'const a = 1;'}];
    const preset = parsePreset(toCliConfig(webPreset));
    const copied = await buildSnapshot({args: renderArgs(), inputs, preset});
    expect(copied.frame).toEqual(webPreset.frame);
    expect(copied.terminal).toEqual(webPreset.terminal);
    expect(copied.editor.options).toEqual(webPreset.editor);
    expect(snapshotDocumentSchema.parse(copied)).toEqual(copied);

    const initial = parsePreset(
      toCliConfig({
        ...webPreset,
        editor: {...webPreset.editor, themeId: 'fleetTheme'},
      }),
    );
    expect(initial.editor.themeId).toBe('fleetDark');

    const overridden = await buildSnapshot({
      args: renderArgs(['--theme', 'fleetDark', '--lines', '1-1']),
      inputs,
      preset,
    });
    expect(overridden.editor.options).toMatchObject({
      themeId: 'fleetDark',
      showLineNumbers: true,
      fontWeight: 700,
    });
    expect(overridden.frame.background).not.toBe('#ff0000');
  });

  it.each([
    ['{', '--preset'],
    ['[]', '--preset'],
    ['{}', '--preset: frame'],
    [
      JSON.stringify({frame: {}, terminal: {}, editor: {}}),
      '--preset: frame.background',
    ],
  ])('names --preset and the field on invalid preset %s', (text, message) => {
    expect(() => parsePreset(text)).toThrow(message);
  });
});
