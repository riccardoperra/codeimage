import {createSignal} from 'solid-js';
import type {Availability} from './model';

/** Where the on-device model stands on this device, as the page shows it. */
export type ModelState =
  | {readonly kind: 'unsupported'}
  | {readonly kind: 'unavailable'}
  | {readonly kind: 'downloadable'}
  /** `loaded` stays undefined until Chrome reports real progress. */
  | {readonly kind: 'downloading'; readonly loaded: number | undefined}
  | {readonly kind: 'available'}
  | {readonly kind: 'failed'; readonly error: string};

/**
 * A Prompt API session. With tool calls expected, the stream yields
 * `{type, value}` parts.
 */
export interface Session {
  promptStreaming(
    input: unknown,
    options?: {signal?: AbortSignal},
  ): ReadableStream<unknown>;
  append(input: unknown, options?: {signal?: AbortSignal}): Promise<void>;
  clone(options?: {signal?: AbortSignal}): Promise<Session>;
  destroy(): void;
}

interface Monitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: Event & {loaded: number}) => void,
  ): void;
}

/** The part of the Prompt API (`LanguageModel`) that the page uses. */
export interface LanguageModelApi {
  availability(options?: object): Promise<Availability>;
  create(options: {
    tools?: readonly object[];
    expectedInputs?: readonly object[];
    expectedOutputs?: readonly object[];
    initialPrompts?: readonly {role: 'system'; content: string}[];
    monitor?: (monitor: Monitor) => void;
    signal?: AbortSignal;
  }): Promise<Session>;
}

// Chrome warns, and may refuse, when a session does not name its languages.
const LANGUAGES = {
  expectedInputs: [{type: 'text', languages: ['en']}],
  expectedOutputs: [{type: 'text', languages: ['en']}],
};

// Chrome often reports download progress only at 0 and 1, so the page also
// asks again while a download runs.
export const POLL_MS = 5000;

/** Console trace of the model's life, filtered with "[local-ai]". */
export const log = (...args: unknown[]) => console.info('[local-ai]', ...args);

export function createLanguageModel(api: LanguageModelApi | undefined) {
  const [state, setState] = createSignal<ModelState>(
    api ? {kind: 'unavailable'} : {kind: 'unsupported'},
  );
  const [creating, setCreating] = createSignal(false);
  let poll: ReturnType<typeof setInterval> | undefined;

  const set = (next: ModelState) => {
    log('state', next);
    setState(next);
    if (next.kind === 'downloading') {
      poll ??= setInterval(() => void refresh(), POLL_MS);
    } else if (poll !== undefined) {
      clearInterval(poll);
      poll = undefined;
    }
  };

  // Chrome's sample asks with the options it then creates with, and never
  // creates when the answer is 'unavailable'.
  async function check(): Promise<Availability> {
    try {
      const answer = (await api?.availability(LANGUAGES)) ?? 'unavailable';
      log('availability()', answer);
      return answer;
    } catch (error) {
      log('availability() threw', error);
      return 'unavailable';
    }
  }

  function apply(next: Availability) {
    const now = state();
    // Our own download decides when it ends, and a failure stays on screen
    // with its Retry until a download succeeds.
    if (creating() && next !== 'available') return;
    if (now.kind === 'failed' && next === 'downloadable') return;
    if (next === 'downloading') {
      if (now.kind !== 'downloading') {
        set({kind: 'downloading', loaded: undefined});
      }
      return;
    }
    set({kind: next});
  }

  /** Asks Chrome again where the model stands. */
  async function refresh() {
    if (api) apply(await check());
  }

  /**
   * Downloads the model, or asks Chrome again for a download it reports but
   * does not move, such as one that stopped for lack of disk space. Chrome
   * needs a user gesture, so call it from a click.
   */
  async function download() {
    if (!api || creating() || state().kind === 'available') return;
    setCreating(true);
    try {
      const before = await check();
      if (before === 'unavailable' || before === 'available') {
        set({kind: before});
        return;
      }
      set({kind: 'downloading', loaded: undefined});
      log('create() to download the model');
      const session = await api.create({
        ...LANGUAGES,
        monitor: monitor =>
          monitor.addEventListener('downloadprogress', event => {
            log('downloadprogress', event.loaded);
            if (state().kind !== 'downloading') return;
            set({kind: 'downloading', loaded: event.loaded || undefined});
          }),
      });
      log('create() resolved, the model is downloaded');
      session.destroy();
      set({kind: 'available'});
    } catch (error) {
      log('download failed', error);
      set({
        kind: 'failed',
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setCreating(false);
    }
  }

  if (!api) log('this browser has no LanguageModel');
  void refresh();
  return {
    state,
    /** True while this page's own `create()` call waits for the model. */
    requesting: creating,
    refresh,
    download,
  };
}

/** The Prompt API, when this browser has it. */
export const chromeLanguageModel = (
  globalThis as {LanguageModel?: LanguageModelApi}
).LanguageModel;

/** Chrome's on-device model, shared by Settings and the local AI bar. */
export const languageModel = createLanguageModel(chromeLanguageModel);
