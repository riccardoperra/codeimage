import {extname} from 'node:path';
import {
  ANIMATION_DEFAULTS,
  ANIMATION_FPS,
  animationFps,
  parseAnimationDocument,
  parseAnimationSettings,
  parseEasing,
} from '@codeimage/render';
import type {
  AnimationDocument,
  AnimationSettings,
  SnapshotDocument,
} from '@codeimage/render';
import {UsageError} from '../errors';
import type {Preset} from '../snapshot';
import type {Flag, FlagValues} from './index';

type Format = AnimationDocument['format'];

const FORMATS = new Map<string, Format>([
  ['webp', 'webp'],
  ['gif', 'gif'],
  ['apng', 'apng'],
  ['png', 'apng'],
]);

const TIMING_FLAGS = ['hold', 'transition', 'easing', 'fps'];

export interface AnimationArgs {
  format: Format;

  holdMs?: number;
  transitionMs?: number;
  easing?: AnimationSettings['easing'];
  fps?: AnimationSettings['fps'];
}

function format(values: FlagValues): Format {
  const name = (
    typeof values.format === 'string'
      ? values.format
      : extname(typeof values.output === 'string' ? values.output : '').slice(1)
  ).toLowerCase();
  if (name === '' && values.format === undefined) return 'webp';
  const format = FORMATS.get(name);
  if (!format) {
    throw new UsageError(
      `--animate: cannot write .${name}. ${name === 'mp4' ? 'MP4 arrives in a later version. ' : ''}Use .webp, .gif, .apng, or .png`,
    );
  }
  return format;
}

const LIMITS = {hold: {min: 0, max: 10_000}, transition: {min: 100, max: 5000}};

function milliseconds(values: FlagValues, flag: 'hold' | 'transition') {
  const value = values[flag];
  if (value === undefined) return undefined;
  const ms = typeof value === 'string' && value.trim() ? Number(value) : NaN;
  const {min, max} = LIMITS[flag];
  if (!Number.isFinite(ms) || ms < min || ms > max) {
    throw new UsageError(
      `--${flag}: expected milliseconds from ${min} to ${max}`,
    );
  }
  return ms;
}

export function parseAnimation(values: FlagValues): AnimationArgs | undefined {
  if (!values.animate) {
    const flag = TIMING_FLAGS.find(flag => values[flag] !== undefined);
    if (flag) throw new UsageError(`--${flag}: needs --animate`);
    return undefined;
  }
  for (const flag of ['split-tabs', 'alt']) {
    if (values[flag]) {
      throw new UsageError(
        `--${flag}: --animate writes one file with every tab as a step`,
      );
    }
  }
  const easing =
    typeof values.easing === 'string' ? parseEasing(values.easing) : undefined;
  if (easing === null) {
    throw new UsageError(
      '--easing: expected smooth, snappy, strong, linear, or cubic-bezier(x1, y1, x2, y2)',
    );
  }
  const fps =
    values.fps === undefined
      ? undefined
      : ANIMATION_FPS.find(fps => fps === Number(values.fps));
  if (values.fps !== undefined && fps === undefined) {
    throw new UsageError('--fps: expected 24, 30, 50, or 60');
  }
  return {
    format: format(values),
    holdMs: milliseconds(values, 'hold'),
    transitionMs: milliseconds(values, 'transition'),
    easing,
    fps,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

function storedAnimation(snapshot: SnapshotDocument, preset?: Preset): unknown {
  if ('animation' in snapshot) return snapshot.animation;
  const stored = isRecord(preset?.animation) ? preset.animation : {};
  const steps = Array.isArray(stored.steps) ? stored.steps : [];
  return {
    ...stored,
    steps: snapshot.editor.editors.map(({id}, index) => ({
      ...(isRecord(steps[index]) ? steps[index] : {}),
      id,
      editorId: id,
    })),
  };
}

function withFlags(
  settings: AnimationSettings,
  args: AnimationArgs,
): AnimationSettings {
  const [first, ...rest] = settings.steps.map(step => ({
    ...step,
    holdMs: args.holdMs ?? step.holdMs,
    ...(step.transition && {
      transition: {
        ms: args.transitionMs ?? step.transition.ms,
        easing: args.easing ?? step.transition.easing,
      },
    }),
  }));
  return {
    ...settings,
    steps: [first, ...rest],
    transitionMs: args.transitionMs ?? settings.transitionMs,
    easing: args.easing ?? settings.easing,
    fps: args.fps ?? settings.fps,
  };
}

export function planAnimation(
  snapshot: SnapshotDocument,
  args: AnimationArgs,
  preset?: Preset,
): {document: AnimationDocument; notes: string[]} {
  const [first, ...rest] = snapshot.editor.editors;
  const stored = storedAnimation(snapshot, preset);
  const settings = withFlags(
    parseAnimationSettings(stored, [first.id, ...rest.map(({id}) => id)]),
    args,
  );
  if (settings.steps.length < 2) {
    throw new UsageError(
      '--animate: needs two or more steps, one per input file or tab',
    );
  }
  let document: AnimationDocument;
  try {
    document = parseAnimationDocument({
      ...snapshot,
      format: args.format,
      animation: settings,
    });
  } catch (error) {
    throw new UsageError(
      `--animate: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const played = animationFps(document.format, document.animation.fps);

  const asked =
    args.fps ??
    ANIMATION_FPS.find(fps => isRecord(stored) && fps === stored.fps);
  return {
    document,
    notes:
      asked !== undefined && played !== asked
        ? [
            `GIF supports 50 or 25 fps, so this one plays at ${played} instead of ${asked}`,
          ]
        : [],
  };
}

const {holdMs, transitionMs, easing, fps} = ANIMATION_DEFAULTS;

export const animate: Flag = {
  args: {
    animate: {
      type: 'boolean',
      description:
        'Write one animation that morphs each tab into the next, as .webp, .gif, .apng, or .png',
    },
    hold: {
      type: 'string',
      valueHint: 'ms',
      description: `Time each step stays still (default: ${holdMs})`,
    },
    transition: {
      type: 'string',
      valueHint: 'ms',
      description: `Time of each morph (default: ${transitionMs})`,
    },
    easing: {
      type: 'string',
      valueHint: 'name',
      description: `smooth, snappy, strong, linear, or cubic-bezier(x1, y1, x2, y2) (default: ${easing})`,
    },
    fps: {
      type: 'string',
      valueHint: 'n',
      description: `24, 30, 50, or 60 (default: ${fps}). GIF plays at 50 or 25`,
    },
  },
};
