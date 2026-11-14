import {describe, expect, it, vi} from 'vitest';
import {prepare} from './test-utils';
import {renderSnapshot} from '@codeimage/render';

const token = `ghp_${'aB3dE6gH9jK2mN5pQ8sT1vW4yZ7cF0iL3oP6'}`;

describe('redaction flag', () => {
  it('masks by default and reports source location and rule without leaking the token', async () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    try {
      const {snapshot} = await prepare(
        ['--format', 'svg'],
        [{name: 'a.ts', code: `const value = 1;\nconst key = "${token}";`}],
      );
      const tab = snapshot.editor.editors[0];
      expect(tab.code).toContain(`ghp_${'•'.repeat(36)}`);
      expect(tab.code).not.toContain(token);
      const output = stderr.mock.calls.map(call => call[0]).join('');
      expect(output).toBe('a.ts:2:14: github-pat\nredacted 1 secret\n');
      expect(output).not.toContain(token);
      expect(await renderSnapshot(snapshot)).not.toContain(token);
    } finally {
      stderr.mockRestore();
    }
  });
  it('reports the original location before annotation comments are removed', async () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    try {
      const {snapshot} = await prepare(
        [],
        [{name: 'a.ts', code: `// [!code highlight]\nconst key = "${token}";`}],
      );
      expect(snapshot.editor.editors[0].code).not.toContain('[!code');
      expect(stderr.mock.calls[0][0]).toBe('a.ts:2:14: github-pat\n');
    } finally {
      stderr.mockRestore();
    }
  });
  it('keeps the original text and emits no diagnostics with --no-redact', async () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    try {
      const {snapshot} = await prepare(
        ['--no-redact'],
        [{name: 'a.ts', code: token}],
      );
      expect(snapshot.editor.editors[0].code).toBe(token);
      expect(stderr).not.toHaveBeenCalled();
    } finally {
      stderr.mockRestore();
    }
  });
  it('aggregates matches across files and does not diagnose clean input', async () => {
    const stderr = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);
    try {
      await prepare(
        [],
        [
          {name: 'a.ts', code: token},
          {name: 'b.py', code: token},
        ],
      );
      expect(stderr.mock.calls.at(-1)?.[0]).toBe('redacted 2 secrets\n');
      stderr.mockClear();
      await prepare([]);
      expect(stderr).not.toHaveBeenCalled();
    } finally {
      stderr.mockRestore();
    }
  });
});
