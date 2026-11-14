import {altText} from '../../../../apps/codeimage/src/core/altText';
import {UsageError} from '../errors';
import type {Flag} from './index';

export const alt: Flag = {
  options: {alt: {type: 'boolean'}},
  usage: '  --alt               Write <output>.alt.txt next to each image\n',
  validate(values) {
    if (values.alt && values.output === '-')
      throw new UsageError('--alt: -o must be a file path for the sidecar');
  },
  apply: snapshot => snapshot,
  sidecars(output, values) {
    if (!values.alt) return [];
    const tab = output.snapshot.editor.editors[0];
    return [
      {
        path: `${output.path}.alt.txt`,
        text: altText({...tab, tab: {tabName: tab.tabName}}),
      },
    ];
  },
};
