import {FontFileError} from '@codeimage/render';
export class UsageError extends Error {}
export interface ErrorReport {
  message: string;
  hint?: string;
  exitCode: 1 | 2;
}
export function describeError(error: unknown): ErrorReport {
  const usage = error instanceof UsageError || error instanceof FontFileError;
  return {
    message: error instanceof Error ? error.message : String(error),
    hint: usage ? 'Run codeimage --help for usage.' : undefined,
    exitCode: usage ? 2 : 1,
  };
}
