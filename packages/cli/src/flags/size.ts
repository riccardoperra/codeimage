import {getExportTarget} from '@codeimage/config';
import type {SnapshotInput} from '@codeimage/render';
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

function position(
  values: FlagValues,
): NonNullable<SnapshotInput['frame']['signature']>['position'] {
  const value = values['signature-position'] ?? 'bottom-right';
  if (value !== 'bottom-left' && value !== 'bottom-right') {
    throw new UsageError(
      '--signature-position: expected bottom-left or bottom-right',
    );
  }
  return value;
}

export const size: Flag = {
  options: {
    size: {type: 'string'},
    signature: {type: 'string'},
    'signature-position': {type: 'string'},
  },
  usage:
    '  --size <target>     x-landscape, square, linkedin-portrait, or og\n  --signature <text>  Add a handle to the frame\n  --signature-position <corner>  bottom-left or bottom-right (default)\n',
  validate(values) {
    target(values);
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
    const signature =
      typeof values.signature === 'string'
        ? {handle: values.signature.trim(), position: position(values)}
        : snapshot.frame.signature;
    return {
      ...snapshot,
      frame: {
        ...snapshot.frame,
        ...(selected && {
          exportTarget: selected.id,
          aspectRatio: selected.ratio,
        }),
        ...(signature !== undefined && {signature}),
        ...(values['signature-position'] !== undefined &&
          signature && {signature: {...signature, position: position(values)}}),
      },
    };
  },
};
