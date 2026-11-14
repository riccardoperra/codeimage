import {detectSecrets, redactSecrets} from '@codeimage/secrets';
import type {Flag} from './index';

export const redact: Flag = {
  options: {'no-redact': {type: 'boolean'}},
  usage:
    '  --no-redact         Disable default secret redaction and diagnostics\n',
  apply: snapshot => snapshot,
  async prepareInputs(inputs, values) {
    if (values['no-redact']) return inputs;
    let count = 0;
    const redacted = inputs.map(input => {
      const matches = detectSecrets(input.code);
      for (const match of matches) {
        const preceding = input.code.slice(0, match.from).split(/\r\n|\r|\n/);
        const column = (preceding.at(-1)?.length ?? 0) + 1;
        process.stderr.write(
          `${input.name}:${preceding.length}:${column}: ${match.ruleId}\n`,
        );
      }
      count += matches.length;
      return {...input, code: redactSecrets(input.code, matches)};
    });
    if (count) process.stderr.write(`redacted ${count} secrets\n`);
    return redacted;
  },
};
