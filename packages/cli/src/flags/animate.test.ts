import {describe, expect, it} from 'vitest';
import {parseArgs, UsageError} from '../args';
import {parsePreset} from '../snapshot';
import {planAnimation} from './animate';
import {prepare} from './test-utils';

const inputs = [
  {name: 'a.ts', code: 'const a = 1;'},
  {name: 'b.py', code: 'print(2)'},
  {name: 'c.rs', code: 'fn main() {}'},
];

async function plan(argv: string[], files = inputs, presetJson?: object) {
  const preset = presetJson
    ? parsePreset(JSON.stringify(presetJson))
    : undefined;
  const {snapshot, args} = await prepare(['--animate', ...argv], files, preset);
  if (!args.animation) throw new Error('Expected animation arguments');
  return {...planAnimation(snapshot, args.animation, preset), args};
}

const presetWith = (animation?: object) => ({
  frame: {
    background: '#ff0000',
    padding: 32,
    radius: 0,
    visible: true,
    opacity: 100,
  },
  terminal: {
    showHeader: true,
    type: 'macOs',
    accentVisible: false,
    shadow: null,
    background: '#111111',
    textColor: '#eeeeee',
    showWatermark: false,
    showGlassReflection: false,
    opacity: 100,
    alternativeTheme: false,
    borderType: null,
  },
  editor: {
    fontId: 'jetbrains-mono',
    fontWeight: 400,
    showLineNumbers: false,
    themeId: 'dracula',
    enableLigatures: true,
  },
  animation,
});

describe('animate flag', () => {
  it('makes each input file a step, in the order given', async () => {
    const {document} = await plan([]);
    const tabs = document.editor.editors;
    expect(tabs.map(tab => tab.code)).toEqual(inputs.map(input => input.code));
    expect(document.animation).toEqual({
      steps: tabs.map(tab => ({id: tab.id, editorId: tab.id, holdMs: 800})),
      transitionMs: 700,
      easing: 'smooth',
      fps: 30,
      header: {mode: 'tab', title: ''},
    });
  });

  it('sets the timing from the flags, in whole milliseconds', async () => {
    const {document} = await plan([
      '--hold',
      '250',
      '--transition',
      '400.4',
      '--easing',
      'linear',
      '--fps',
      '60',
    ]);
    expect(document.animation).toMatchObject({
      steps: [{holdMs: 250}, {holdMs: 250}, {holdMs: 250}],
      transitionMs: 400,
      easing: 'linear',
      fps: 60,
    });
  });

  it('takes the timing of a preset with animation settings, and flags override it', async () => {
    const preset = presetWith({
      steps: [
        {editorId: 'tab-2', holdMs: 100},
        {editorId: 'tab-1', holdMs: 300},
      ],
      transitionMs: 500,
      easing: 'snappy',
      fps: 50,
    });
    const stored = await plan([], inputs, preset);
    expect(stored.document.animation).toMatchObject({
      steps: [{holdMs: 100}, {holdMs: 300}, {holdMs: 800}],
      transitionMs: 500,
      easing: 'snappy',
      fps: 50,
    });
    expect(stored.document.frame.background).toBe('#ff0000');
    const overridden = await plan(
      ['--hold', '50', '--fps', '24'],
      inputs,
      preset,
    );
    expect(overridden.document.animation).toMatchObject({
      steps: [{holdMs: 50}, {holdMs: 50}, {holdMs: 50}],
      transitionMs: 500,
      easing: 'snappy',
      fps: 24,
    });
  });

  it('gives the preset steps transitions and header to the files in order', async () => {
    const preset = presetWith({
      steps: [
        {id: 's1', editorId: 'tab-2', holdMs: 100},
        {
          id: 's2',
          editorId: 'tab-1',
          holdMs: 300,
          transition: {ms: 1200, easing: 'cubic-bezier(0.1, 0.2, 0.3, 1)'},
        },
        {
          id: 's3',
          editorId: 'tab-3',
          holdMs: 0,
          transition: {ms: 450, easing: 'strong'},
        },
      ],
      transitionMs: 500,
      easing: 'snappy',
      fps: 60,
      header: {mode: 'title', title: 'A story'},
    });
    const {document} = await plan([], inputs, preset);
    const ids = document.editor.editors.map(tab => tab.id);
    expect(document.animation).toEqual({
      steps: [
        {id: ids[0], editorId: ids[0], holdMs: 100},
        {
          id: ids[1],
          editorId: ids[1],
          holdMs: 300,
          transition: {ms: 1200, easing: 'cubic-bezier(0.1, 0.2, 0.3, 1)'},
        },
        {
          id: ids[2],
          editorId: ids[2],
          holdMs: 0,
          transition: {ms: 450, easing: 'strong'},
        },
      ],
      transitionMs: 500,
      easing: 'snappy',
      fps: 60,
      header: {mode: 'title', title: 'A story'},
    });
    const flagged = await plan(
      ['--transition', '800', '--easing', 'linear'],
      inputs,
      preset,
    );
    expect(flagged.document.animation).toMatchObject({
      steps: [
        {holdMs: 100},
        {transition: {ms: 800, easing: 'linear'}},
        {transition: {ms: 800, easing: 'linear'}},
      ],
      transitionMs: 800,
      easing: 'linear',
    });
  });

  it('reads invalid preset settings as the editor does', async () => {
    const preset = presetWith({steps: [], transitionMs: 1, easing: 'bounce'});
    expect((await plan([], inputs, preset)).document.animation).toMatchObject({
      transitionMs: 100,
      easing: 'smooth',
    });
  });

  it('plays a saved project input with its own steps, timing and header', async () => {
    const project = {
      $snippetId: null,
      $version: '1.10.0',
      ...presetWith(undefined),
      editor: {
        options: presetWith(undefined).editor,
        editors: ['one', 'two', 'three'].map(id => ({
          id,
          code: `const ${id} = 1;`,
          tabName: `${id}.ts`,
          languageId: 'typescript',
          lineNumberStart: 1,
        })),
      },
      animation: {
        steps: [
          {id: 'x', editorId: 'three', holdMs: 400},
          {
            id: 'y',
            editorId: 'one',
            holdMs: 600,
            transition: {ms: 1100, easing: 'strong'},
          },
        ],
        transitionMs: 700,
        easing: 'snappy',
        fps: 24,
        header: {mode: 'tabs', title: ''},
      },
    };
    const files = [{name: 'project.json', code: JSON.stringify(project)}];
    const {document, notes} = await plan(['-o', 'demo.gif'], files);
    const saved = {
      ...project,
      editor: {
        ...project.editor,
        options: {...project.editor.options, themeId: 'fleetTheme'},
      },
    };
    expect(
      (await plan([], [{name: 'saved.json', code: JSON.stringify(saved)}]))
        .document.editor.options.themeId,
    ).toBe('fleetDark');
    expect(document.editor.editors.map(tab => tab.id)).toEqual([
      'one',
      'two',
      'three',
    ]);
    expect(document.frame.background).toBe('#ff0000');
    expect(document.animation).toEqual(project.animation);
    expect(notes).toEqual([
      'GIF supports 50 or 25 fps, so this one plays at 25 instead of 24',
    ]);
    await expect(plan(['--theme', 'dracula'], files)).rejects.toThrow(
      '--theme: a project input keeps its own settings',
    );
    const plain = await plan([], [files[0], inputs[0]]);
    expect(plain.document.editor.editors[0].code).toBe(files[0].code);
  });

  it('keeps a still export working with invalid animation settings', () => {
    const preset = presetWith({steps: [], transitionMs: 1});
    expect(() => parsePreset(JSON.stringify(preset))).not.toThrow();
  });

  it.each([
    [['-o', 'demo.webp'], 'webp', 'demo.webp'],
    [['-o', 'demo.gif'], 'gif', 'demo.gif'],
    [['-o', 'demo.GIF'], 'gif', 'demo.GIF'],
    [['-o', 'demo.apng'], 'apng', 'demo.apng'],
    [['-o', 'demo.png'], 'apng', 'demo.png'],
    [['-o', 'demo'], 'webp', 'demo'],
    [['-o', '-'], 'webp', '-'],
    [['-o', '-', '--format', 'gif'], 'gif', '-'],
    [['-o', 'demo.gif', '--format', 'webp'], 'webp', 'demo.gif'],
    [[], 'webp', 'codeimage.webp'],
    [['--format', 'apng'], 'apng', 'codeimage.apng'],
  ])('with %j writes %s to %s', async (argv, format, output) => {
    const {document, args} = await plan(argv);
    expect(document.format).toBe(format);
    expect(args.output).toBe(output);
  });

  it.each([
    [['-o', 'demo.jpg'], 'cannot write .jpg. Use'],
    [['-o', 'demo.svg'], 'cannot write .svg. Use'],
    [['--format', 'jpeg'], 'cannot write .jpeg. Use'],
  ])(
    'rejects %j as a usage error and names the supported extensions',
    (argv, message) => {
      const parse = () => parseArgs(['--animate', ...argv]);
      expect(parse).toThrow(UsageError);
      expect(parse).toThrow(`--animate: cannot write`);
      expect(parse).toThrow(message);
      expect(parse).toThrow('Use .webp, .gif, .apng, or .png');
    },
  );

  it.each([
    [['--fps', '60'], '50 instead of 60'],
    [['--fps', '30'], '25 instead of 30'],
    [['--fps', '24'], '25 instead of 24'],
  ])('with %j notes that the GIF plays at %s', async (argv, note) => {
    const {notes} = await plan([...argv, '-o', 'demo.gif']);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain('GIF supports 50 or 25 fps');
    expect(notes[0]).toContain(note);
  });

  it('notes the GIF rate when the preset asks for another one', async () => {
    const preset = presetWith({
      steps: [{editorId: 'tab-1', holdMs: 100}],
      transitionMs: 200,
      easing: 'linear',
      fps: 60,
    });
    const {notes} = await plan(['-o', 'demo.gif'], inputs, preset);
    expect(notes).toEqual([
      'GIF supports 50 or 25 fps, so this one plays at 50 instead of 60',
    ]);
  });

  it('notes nothing for a rate the file plays, or one nobody asked for', async () => {
    expect((await plan(['--fps', '50', '-o', 'demo.gif'])).notes).toEqual([]);
    expect((await plan(['-o', 'demo.gif'])).notes).toEqual([]);
    expect((await plan(['--fps', '60', '-o', 'demo.webp'])).notes).toEqual([]);
  });

  it.each([
    [['--hold', '100'], '--hold: needs --animate'],
    [['--transition', '100'], '--transition: needs --animate'],
    [['--easing', 'linear'], '--easing: needs --animate'],
    [['--fps', '60'], '--fps: needs --animate'],
  ])('rejects %j without --animate', (argv, message) => {
    expect(() => parseArgs(argv)).toThrow(UsageError);
    expect(() => parseArgs(argv)).toThrow(message);
  });

  it.each([
    [['--hold=-1'], '--hold: expected milliseconds from 0 to 10000'],
    [['--hold', 'soon'], '--hold: expected milliseconds from 0 to 10000'],
    [['--hold', ''], '--hold: expected milliseconds from 0 to 10000'],
    [['--hold', '10001'], '--hold: expected milliseconds from 0 to 10000'],
    [['--transition', '99'], '--transition: expected milliseconds from 100'],
    [['--transition', '5001'], '--transition: expected milliseconds from 100'],
    [['--transition', 'Infinity'], '--transition: expected milliseconds'],
    [
      ['--easing', 'bounce'],
      '--easing: expected smooth, snappy, strong, linear, or cubic-bezier',
    ],
    [['--easing', 'cubic-bezier(2, 0, 0, 1)'], '--easing: expected smooth'],
    [['--fps', '25'], '--fps: expected 24, 30, 50, or 60'],
    [['--fps', 'fast'], '--fps: expected 24, 30, 50, or 60'],
    [['--split-tabs'], '--split-tabs: --animate writes one file'],
    [['--alt'], '--alt: --animate writes one file'],
  ])('rejects %j', (argv, message) => {
    const parse = () => parseArgs(['--animate', '-o', 'demo.webp', ...argv]);
    expect(parse).toThrow(UsageError);
    expect(parse).toThrow(message);
  });

  it.each([
    ['strong', 'strong'],
    ['cubic-bezier(0.1,0.2,0.3,1)', 'cubic-bezier(0.1, 0.2, 0.3, 1)'],
    ['0.65, 0, 0.35, 1', 'smooth'],
  ])('reads --easing %s as %s', async (value, easing) => {
    const {document} = await plan(['--easing', value]);
    expect(document.animation.easing).toBe(easing);
  });

  it('rejects a single step, which would be a still image', async () => {
    await expect(plan([], [inputs[0]])).rejects.toThrow(
      '--animate: needs two or more steps',
    );
  });

  it('accepts holds of 0 ms while the transitions move', async () => {
    const moving = await plan(['--hold', '0']);
    expect(moving.document.animation.transitionMs).toBe(700);
  });

  it('keeps the format rules of a still image without --animate', () => {
    expect(parseArgs(['-o', 'demo.webp'])).toMatchObject({
      format: 'webp',
      animation: undefined,
    });
  });
});
