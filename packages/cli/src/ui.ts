import {stripVTControlCharacters} from 'node:util';
import {confirm, isCancel, log, multiselect, spinner} from '@clack/prompts';
import type {FontEvent} from '@codeimage/render';
import type {ErrorReport} from './errors';

export function formatHelpUsage(
  message: string,
  quiet = false,
  stdoutTTY = !!process.stdout.isTTY,
  env = process.env,
) {
  const color =
    stdoutTTY &&
    !quiet &&
    env.NO_COLOR === undefined &&
    env.CI === undefined &&
    env.TERM !== 'dumb';
  const title = color ? '\x1b[1mCodeImage CLI\x1b[0m' : 'CodeImage CLI';
  const links = [
    'https://app.codeimage.dev',
    'https://github.com/riccardoperra/codeimage',
  ]
    .map(url => (color ? `\x1b]8;;${url}\x1b\\${url}\x1b]8;;\x1b\\` : url))
    .join(' · ');
  const body = message.replace(' (codeimage)', '');
  return `${title}\n${color ? `\x1b[2m${links}\x1b[0m` : links}\n\n${color ? body : stripVTControlCharacters(body)}`;
}

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
  let status = '';
  let downloading = 0;
  const files = () => `${downloading} file${downloading === 1 ? '' : 's'}`;
  const text = (message: string) => {
    process.stderr.write(message.endsWith('\n') ? message : `${message}\n`);
  };
  const show = (message: string) => {
    status = message;
    progress?.message(message);
  };
  const warn = (message: string) => {
    if (mode !== 'interactive') return text(`codeimage: ${message}`);
    // A line written under a running spinner stays glued to its frame.
    progress?.clear();
    log.warn(message, common);
    if (progress) {
      progress = spinner(common);
      progress.start(status);
    }
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
    usage: (message: string) => text(formatHelpUsage(message, quiet)),
    success,
    warn,
    async run<T>(label: string, work: () => Promise<T>): Promise<T> {
      phase = status = label;
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
        show(`Downloading ${event.label} (${files()})`);
      } else if (event.type === 'downloaded') {
        downloading--;
        show(downloading ? `Downloading fonts (${files()})` : phase);
        if (mode === 'plain')
          text(`codeimage: downloaded ${event.label} (${event.bytes} B)`);
      } else if (event.type === 'cache-unwritable') warn(event.message);
      else if (mode !== 'quiet') warn(`repairing cached font ${event.fontId}`);
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
