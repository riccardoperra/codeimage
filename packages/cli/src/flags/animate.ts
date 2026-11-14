import {extname} from 'node:path';
import {
  ANIMATION_DEFAULTS,
  animationFps,
  animationSettingsSchema,
  parseAnimationDocument,
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

// The format each output extension writes. An animated .png is an APNG.
const FORMATS = new Map<string, Format>([
  ['webp', 'webp'],
  ['gif', 'gif'],
  ['apng', 'apng'],
  ['png', 'apng'],
]);

const TIMING_FLAGS = ['hold', 'transition', 'easing', 'fps'];

export interface AnimationArgs {
  format: Format;
  // Timing that no flag sets comes from the preset, then from the defaults.
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

function milliseconds(values: FlagValues, flag: 'hold' | 'transition') {
  const value = values[flag];
  if (value === undefined) return undefined;
  const ms = typeof value === 'string' && value.trim() ? Number(value) : NaN;
  if (!Number.isFinite(ms) || ms < 0) {
    throw new UsageError(`--${flag}: expected milliseconds, 0 or more`);
  }
  return ms;
}

// Undefined without --animate.
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
  const {easing, fps} = animationSettingsSchema.shape;
  const parsedEasing = easing.optional().safeParse(values.easing);
  if (!parsedEasing.success) {
    throw new UsageError('--easing: expected smooth, snappy, or linear');
  }
  const parsedFps = fps
    .optional()
    .safeParse(values.fps === undefined ? undefined : Number(values.fps));
  if (!parsedFps.success) {
    throw new UsageError('--fps: expected 24, 30, 50, or 60');
  }
  return {
    format: format(values),
    holdMs: milliseconds(values, 'hold'),
    transitionMs: milliseconds(values, 'transition'),
    easing: parsedEasing.data,
    fps: parsedFps.data,
  };
}

// Every tab of the snapshot is one step, in tab order. `notes` are for
// stderr.
export function planAnimation(
  snapshot: SnapshotDocument,
  args: AnimationArgs,
  preset?: Preset,
): {document: AnimationDocument; notes: string[]} {
  const stored = preset?.animation;
  const fps = args.fps ?? stored?.fps;
  let document: AnimationDocument;
  try {
    document = parseAnimationDocument({
      ...snapshot,
      format: args.format,
      animation: {
        steps: snapshot.editor.editors.map(({id}, index) => ({
          editorId: id,
          holdMs:
            args.holdMs ??
            stored?.steps[index]?.holdMs ??
            ANIMATION_DEFAULTS.holdMs,
        })),
        transitionMs:
          args.transitionMs ??
          stored?.transitionMs ??
          ANIMATION_DEFAULTS.transitionMs,
        easing: args.easing ?? stored?.easing ?? ANIMATION_DEFAULTS.easing,
        fps: fps ?? ANIMATION_DEFAULTS.fps,
      },
    });
  } catch (error) {
    throw new UsageError(
      `--animate: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const played = animationFps(document.format, document.animation.fps);
  return {
    document,
    notes:
      fps !== undefined && played !== fps
        ? [
            `--fps: GIF supports 50, 25, or 20 fps, so this one plays at ${played} instead of ${fps}`,
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
      description: `smooth, snappy, or linear (default: ${easing})`,
    },
    fps: {
      type: 'string',
      valueHint: 'n',
      description: `24, 30, 50, or 60 (default: ${fps}). GIF plays at 50, 25, or 20`,
    },
  },
};
