import {confirm, isCancel, log, multiselect, spinner} from '@clack/prompts';
import type {FontEvent} from '@codeimage/render';
import type {ErrorReport} from './errors';

export function uiMode(
  quiet: boolean,
  stdoutTTY = !!process.stdout.isTTY,
  stderrTTY = !!process.stderr.isTTY,
  env = process.env,
) {
  if (quiet) return 'quiet';
  return stdoutTTY && stderrTTY && !env.CI && env.TERM !== 'dumb'
    ? 'interactive'
    : 'plain';
}
export function createUi(quiet = false) {
  const mode = uiMode(quiet);
  const common = {output: process.stderr, withGuide: false};
  let progress: ReturnType<typeof spinner> | undefined;
  let phase = '';
  let downloading = 0;
  const text = (message: string) => {
    process.stderr.write(message.endsWith('\n') ? message : `${message}\n`);
  };
  const success = (message: string) =>
    mode === 'interactive'
      ? log.success(message, common)
      : text(`codeimage: ${message}`);
  return {
    prompts:
      mode === 'interactive' && process.stdin.isTTY
        ? {
            async confirm(message: string) {
              const result = await confirm({
                ...common,
                message,
                initialValue: false,
              });
              return !isCancel(result) && result;
            },
            async pick(options: {value: string; label: string}[]) {
              const result = await multiselect({
                ...common,
                message: 'Install fonts',
                options,
                required: true,
              });
              return isCancel(result) ? [] : result;
            },
          }
        : undefined,
    text,
    success,
    async run<T>(label: string, work: () => Promise<T>): Promise<T> {
      phase = label;
      if (mode === 'interactive') {
        progress = spinner(common);
        progress.start(label);
      }
      try {
        return await work();
      } finally {
        progress?.clear();
        progress = undefined;
        downloading = 0;
      }
    },
    fontEvent(event: FontEvent) {
      if (event.type === 'download') {
        downloading++;
        progress?.message(`Downloading ${event.label} (${downloading} files)`);
      } else if (event.type === 'downloaded') {
        downloading--;
        progress?.message(
          downloading ? `Downloading fonts (${downloading} files)` : phase,
        );
        if (mode === 'plain')
          text(`codeimage: downloaded ${event.label} (${event.bytes} B)`);
      } else if (event.type === 'cache-unwritable') {
        if (mode === 'interactive') log.warn(event.message, common);
        else text(`codeimage: ${event.message}`);
      } else if (mode !== 'quiet')
        text(`codeimage: repairing cached font ${event.fontId}`);
    },
    rendered(result: {path: string; bytes: number; ms: number}) {
      success(
        `${result.path === '-' ? 'stdout' : result.path} · ${result.bytes} B · ${Math.round(result.ms)} ms`,
      );
    },
    error(report: ErrorReport) {
      progress?.clear();
      progress = undefined;
      if (mode === 'interactive') log.error(report.message, common);
      else text(`codeimage: ${report.message}`);
      if (report.hint) text(report.hint);
    },
  };
}
export type Ui = ReturnType<typeof createUi>;
