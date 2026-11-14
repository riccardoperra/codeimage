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

const presetWith = (animation: object) => ({
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
      steps: tabs.map(tab => ({editorId: tab.id, holdMs: 800})),
      transitionMs: 900,
      easing: 'smooth',
      fps: 30,
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
      // The third file has no step in the preset.
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

  it('names --preset and the field on invalid animation settings', () => {
    expect(() =>
      parsePreset(JSON.stringify(presetWith({steps: [], transitionMs: 1}))),
    ).toThrow('--preset: animation.steps');
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
    [['-o', 'demo.mp4'], '.mp4. MP4 arrives in a later version. Use'],
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
    [['--fps', '24'], '20 instead of 24'],
  ])('with %j notes that the GIF plays at %s', async (argv, note) => {
    const {notes} = await plan([...argv, '-o', 'demo.gif']);
    expect(notes).toHaveLength(1);
    expect(notes[0]).toContain('--fps: GIF supports 50, 25, or 20 fps');
    expect(notes[0]).toContain(note);
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
    [['--hold=-1'], '--hold: expected milliseconds, 0 or more'],
    [['--hold', 'soon'], '--hold: expected milliseconds, 0 or more'],
    [['--hold', ''], '--hold: expected milliseconds, 0 or more'],
    [['--transition', 'Infinity'], '--transition: expected milliseconds'],
    [['--easing', 'bounce'], '--easing: expected smooth, snappy, or linear'],
    [['--fps', '25'], '--fps: expected 24, 30, 50, or 60'],
    [['--fps', 'fast'], '--fps: expected 24, 30, 50, or 60'],
    [['--split-tabs'], '--split-tabs: --animate writes one file'],
    [['--alt'], '--alt: --animate writes one file'],
  ])('rejects %j', (argv, message) => {
    const parse = () => parseArgs(['--animate', '-o', 'demo.webp', ...argv]);
    expect(parse).toThrow(UsageError);
    expect(parse).toThrow(message);
  });

  it('rejects an animation that lasts 0 ms', async () => {
    const message = '--animate: animation: The holds and transitions add up';
    await expect(plan(['--hold', '0'], [inputs[0]])).rejects.toThrow(message);
    await expect(plan(['--hold', '0', '--transition', '0'])).rejects.toThrow(
      UsageError,
    );
    const moving = await plan(['--hold', '0']);
    expect(moving.document.animation.transitionMs).toBe(900);
  });

  it('keeps the format rules of a still image without --animate', () => {
    expect(parseArgs(['-o', 'demo.webp'])).toMatchObject({
      format: 'webp',
      animation: undefined,
    });
  });
});
