import {createSignal} from 'solid-js';

/** What Chrome's Prompt API says about its on-device model. */
export type Availability =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available';

interface Session {
  prompt(
    input: string,
    options?: {responseConstraint?: object; signal?: AbortSignal},
  ): Promise<string>;
  destroy(): void;
}

interface Monitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: Event & {loaded: number}) => void,
  ): void;
}

/** The part of the Prompt API (`LanguageModel`) that the panel uses. */
interface LanguageModelApi {
  availability(options?: object): Promise<Availability>;
  create(options: {
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

const api = () =>
  (globalThis as {LanguageModel?: LanguageModelApi}).LanguageModel;

const [availability, setAvailability] =
  createSignal<Availability>('unavailable');
export {availability};

/** Asks the browser whether its model can run here, once the page needs to know. */
export async function checkAvailability() {
  const model = api();
  if (!model) return;
  try {
    setAvailability(await model.availability(LANGUAGES));
  } catch {
    setAvailability('unavailable');
  }
}

/**
 * Opens a session with the given instructions. When the model still has to
 * download, Chrome downloads it first and `onProgress` hears from 0 to 1.
 * Needs a user gesture while the model is not yet available.
 */
export async function openSession(
  system: string,
  onProgress: (loaded: number) => void,
  signal: AbortSignal,
): Promise<Session> {
  const model = api();
  if (!model) throw new Error('This browser has no on-device model.');
  const session = await model.create({
    ...LANGUAGES,
    initialPrompts: [{role: 'system', content: system}],
    monitor: monitor =>
      monitor.addEventListener('downloadprogress', event =>
        onProgress(event.loaded),
      ),
    signal,
  });
  if (availability() !== 'available') void checkAvailability();
  return session;
}
