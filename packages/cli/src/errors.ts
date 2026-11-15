import {FontFileError, FontUnavailableError} from '@codeimage/render';
import type {z} from 'zod';
export class UsageError extends Error {}

// The first three issues of a failed parse, for one line of stderr.
export function formatIssues(issues: z.core.$ZodIssue[]) {
  const shown = issues
    .slice(0, 3)
    .map(issue => `${issue.path.join('.')}: ${issue.message}`);
  if (issues.length > 3) shown.push(`and ${issues.length - 3} more`);
  return shown.join('; ');
}

export interface ErrorReport {
  message: string;
  hint?: string;
  exitCode: 1 | 2;
}
export function describeError(error: unknown): ErrorReport {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof UsageError || error instanceof FontFileError)
    return {message, hint: 'Run codeimage --help for usage.', exitCode: 2};
  if (error instanceof FontUnavailableError && error.reason !== 'integrity')
    return {
      message,
      hint: `Run: codeimage fonts install ${error.fontId}`,
      exitCode: 1,
    };
  return {message, exitCode: 1};
}
