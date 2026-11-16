import {extname} from 'node:path';
import {UsageError} from '../errors';
import type {Flag} from './index';

export const split: Flag = {
  args: {
    'split-tabs': {
      type: 'boolean',
      description: 'Write one image per tab, such as out-01.png',
    },
  },
  validate(values) {
    if (values['split-tabs'] && values.output === '-')
      throw new UsageError('--split-tabs: -o must be a file path');
  },
  outputs(output, values) {
    if (!values['split-tabs']) return [output];
    const extension = extname(output.path);
    const stem = extension
      ? output.path.slice(0, -extension.length)
      : output.path;
    return output.snapshot.editor.editors.map((tab, index) => ({
      path: `${stem}-${String(index + 1).padStart(2, '0')}${extension || `.${output.snapshot.format ?? 'png'}`}`,
      snapshot: {
        ...output.snapshot,
        editor: {...output.snapshot.editor, editors: [tab]},
      },
    }));
  },
};
