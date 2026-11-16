import {FontFileError, FontUnavailableError} from '@codeimage/render';
import {describe, expect, it} from 'vitest';
import {describeError, UsageError} from './errors';

describe('describeError', () => {
  it('maps usage and font failures to exit codes and hints', () => {
    expect(describeError(new UsageError('bad'))).toMatchObject({exitCode: 2});
    expect(describeError(new FontFileError('bad'))).toMatchObject({
      exitCode: 2,
    });
    for (const reason of ['offline', 'network'] as const)
      expect(
        describeError(new FontUnavailableError('fira-code', reason, 'x')),
      ).toEqual({
        message: 'fira-code: x',
        hint: 'Run: codeimage fonts install fira-code',
        exitCode: 1,
      });

    expect(
      describeError(new FontUnavailableError('fira-code', 'integrity', 'x')),
    ).toEqual({message: 'fira-code: x', exitCode: 1});
  });
});
