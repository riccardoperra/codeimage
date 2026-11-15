import {getExportTarget} from '@codeimage/config';
import {createSignature} from '../../../../apps/codeimage/src/state/frame/model';
import type {SignaturePosition} from '../../../../apps/codeimage/src/state/frame/model';
import {UsageError} from '../errors';
import type {Flag, FlagValues} from './index';

function target(values: FlagValues) {
  if (values.size === undefined) return undefined;
  const target =
    typeof values.size === 'string'
      ? getExportTarget(values.size === 'og' ? 'open-graph' : values.size)
      : undefined;
  if (!target)
    throw new UsageError(
      '--size: expected x-landscape, square, linkedin-portrait, or og',
    );
  return target;
}

function position(values: FlagValues): SignaturePosition {
  const value = values['signature-position'] ?? 'bottom-right';
  if (value !== 'bottom-left' && value !== 'bottom-right') {
    throw new UsageError(
      '--signature-position: expected bottom-left or bottom-right',
    );
  }
  return value;
}

export const size: Flag = {
  args: {
    size: {
      type: 'string',
      valueHint: 'target',
      description:
        'Export at an exact social size: x-landscape, square, linkedin-portrait, or og',
    },
    signature: {
      type: 'string',
      valueHint: 'handle',
      description: 'Show a handle such as @me in a bottom corner',
    },
    'signature-position': {
      type: 'string',
      valueHint: 'corner',
      description: 'bottom-left or bottom-right (default: bottom-right)',
    },
  },
  validate(values) {
    if (target(values) && values.scale !== undefined) {
      throw new UsageError(
        '--scale: --size exports at the exact target size, so drop --scale',
      );
    }
    position(values);
    if (
      values.signature !== undefined &&
      (typeof values.signature !== 'string' || !values.signature.trim())
    ) {
      throw new UsageError('--signature: expected a nonempty handle');
    }
  },
  apply(snapshot, values) {
    const selected = target(values);
    const current = snapshot.frame.signature;
    if (
      values.signature === undefined &&
      values['signature-position'] === undefined
    ) {
      return {
        ...snapshot,
        frame: {
          ...snapshot.frame,
          ...(selected && {
            exportTarget: selected.id,
            aspectRatio: selected.ratio,
          }),
        },
      };
    }
    const handle =
      typeof values.signature === 'string'
        ? values.signature.trim()
        : current?.handle;
    if (!handle && values['signature-position'] !== undefined) {
      throw new UsageError(
        '--signature-position: needs --signature or a preset with a signature',
      );
    }
    return {
      ...snapshot,
      frame: {
        ...snapshot.frame,
        ...(selected && {
          exportTarget: selected.id,
          aspectRatio: selected.ratio,
        }),
        ...(handle && {
          signature: {
            ...(current && current.handle === handle
              ? current
              : {
                  ...createSignature(handle),
                  ...(current && {
                    style: current.style,
                    platform: current.platform,
                  }),
                }),
            handle,
            position:
              values['signature-position'] === undefined && current
                ? current.position
                : position(values),
          },
        }),
      },
    };
  },
};
