import {resolveFontId} from '@codeimage/render';
import {UsageError} from '../errors';
import type {Flag} from './index';

export function fontId(value: string) {
  try {
    return resolveFontId(value);
  } catch (error) {
    throw new UsageError(
      `--font: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
export const fonts: Flag = {
  args: {
    font: {
      type: 'string',
      valueHint: 'id',
      description: 'Code font id (default: jetbrains-mono)',
    },
    'font-file': {
      type: 'string',
      valueHint: 'path',
      description: 'Use a local TTF, OTF, WOFF or WOFF2 font',
    },
    offline: {
      type: 'boolean',
      description: 'Use bundled and cached fonts; never access the network',
    },
    quiet: {
      type: 'boolean',
      description: 'Suppress progress and use plain output',
    },
  },
  validate(values) {
    if (typeof values.font === 'string') fontId(values.font);
    if (values.font !== undefined && values['font-file'] !== undefined)
      throw new UsageError('--font and --font-file are mutually exclusive');
    if (values['font-file'] === '')
      throw new UsageError('--font-file: expected a path');
  },
  apply(snapshot, values) {
    return typeof values.font === 'string'
      ? {
          ...snapshot,
          editor: {
            ...snapshot.editor,
            options: {...snapshot.editor.options, fontId: fontId(values.font)},
          },
        }
      : snapshot;
  },
};
