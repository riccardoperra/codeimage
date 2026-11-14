import {describe, expect, it} from 'vitest';
import {inferLanguage, parseArgs, UsageError} from './args';
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

  it.each(['0', '-1', 'NaN', 'Infinity', ''])(
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
  ])('infers %s as %s from config', (file, language) => {
    expect(inferLanguage(file)).toBe(language);
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
    expect(snapshot).toMatchObject({
      $version: '1.10.0',
      format: 'png',
      scale: 1,
      width: 960,
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

  it('round trips the web preset data shape and gives flags precedence', async () => {
    const inputs = [{name: 'a.ts', code: 'const a = 1;'}];
    const original = await buildSnapshot({args: renderArgs(), inputs});
    const preset = parsePreset(
      JSON.stringify({
        appVersion: original.$version,
        frame: {...original.frame, padding: 32, background: '#ff0000'},
        terminal: {...original.terminal, showWatermark: false},
        editor: {...original.editor.options, fontWeight: 700},
      }),
    );
    const copied = await buildSnapshot({args: renderArgs(), inputs, preset});
    expect(copied.frame).toEqual(preset.frame);
    expect(copied.terminal).toEqual(preset.terminal);
    expect(copied.editor.options).toEqual(preset.editor);
    const initialWebPreset = parsePreset(
      JSON.stringify({
        ...preset,
        appVersion: '1.7.0',
        editor: {...preset.editor, themeId: 'fleetTheme'},
      }),
    );
    expect(initialWebPreset.editor.themeId).toBe('fleetDark');
    const overridden = await buildSnapshot({
      args: renderArgs([
        '--theme',
        'dracula',
        '--lines',
        '1-1',
        '--scale',
        '2',
      ]),
      inputs,
      preset,
    });
    expect(overridden.editor.options).toMatchObject({
      themeId: 'dracula',
      showLineNumbers: true,
      fontWeight: 700,
    });
    expect(overridden.frame.background).not.toBe('#ff0000');
    expect(overridden.scale).toBe(2);
  });

  it.each(['{', '{}', '{"appVersion":"999"}'])(
    'names --preset on invalid JSON or data %s',
    text => {
      expect(() => parsePreset(text)).toThrow('--preset');
    },
  );
});
