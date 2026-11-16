/**
 * Prompt API plumbing that both providers share: reading a stream, the base
 * session each conversation clones, and the context checks around a turn.
 */
import type {LanguageModelApi, Session} from './language-model';
import {log} from './language-model';
import {ContextFullError, ModelStartError} from './model';
import type {ModelEvent, ModelSession, TurnInput} from './model';

export const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const describeError = (error: unknown) =>
  error instanceof Error ? `${error.name}: ${error.message}` : String(error);

export async function* chunks(stream: ReadableStream<unknown>) {
  const reader = stream.getReader();
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) return;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Chrome's docs do not say whether text chunks are deltas or the text so far,
 * so a chunk that repeats what came before adds only its new end.
 */
export const newText = (before: string, chunk: string) =>
  before && chunk.startsWith(before) ? chunk.slice(before.length) : chunk;

const SCHEMA_KEYS: ReadonlySet<string> = new Set([
  'type',
  'properties',
  'required',
  'enum',
  'description',
  'minimum',
  'maximum',
  'items',
]);

/**
 * The schema with only the keywords the explainer shows, or with `keys`. The
 * tools validate their input anyway, so a dropped keyword such as
 * additionalProperties loses nothing.
 */
export function plainSchema(
  schema: unknown,
  keys: ReadonlySet<string> = SCHEMA_KEYS,
): unknown {
  if (!isRecord(schema) || Array.isArray(schema)) return schema;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (!keys.has(key)) continue;
    out[key] =
      key === 'properties' && isRecord(value)
        ? Object.fromEntries(
            Object.entries(value).map(([name, inner]) => [
              name,
              plainSchema(inner, keys),
            ]),
          )
        : key === 'items'
          ? plainSchema(value, keys)
          : value;
  }
  return out;
}

/**
 * Past this share of the context window a conversation ends before its next
 * request, which would otherwise push its oldest turns out unseen.
 */
export const FULL_AT = 0.85;

function contextOf(session: Session) {
  if (session.contextWindow)
    return {used: session.contextUsage ?? 0, size: session.contextWindow};
  if (session.inputQuota)
    return {used: session.inputUsage ?? 0, size: session.inputQuota};
  return undefined;
}

/**
 * One base session per set of create() options, which each conversation
 * clones, so that Chrome reads the instructions once.
 */
export function createBaseSessions(api: LanguageModelApi) {
  let base: {key: string; session: Promise<Session>} | undefined;

  function baseSession(options: Parameters<LanguageModelApi['create']>[0]) {
    const key = JSON.stringify(options);
    if (base?.key === key) return base.session;
    if (base)
      void base.session.then(
        old => old.destroy(),
        () => {},
      );
    log('create() the base session', options);
    const session = api.create(options).catch((error: unknown) => {
      log('create() failed', describeError(error), error);
      throw new ModelStartError(
        error instanceof DOMException && error.name === 'InvalidStateError'
          ? 'resources'
          : 'unsupported',
        {cause: error},
      );
    });
    const entry = {key, session};
    base = entry;
    session.catch(() => {
      if (base === entry) base = undefined;
    });
    return session;
  }

  return async (
    options: Parameters<LanguageModelApi['create']>[0],
    signal: AbortSignal,
  ) => {
    const base = await baseSession(options);
    log('clone() the base session');
    return base.clone({signal});
  };
}

/**
 * A cloned session as a conversation: a text turn in a conversation that is
 * nearly full, or one Chrome refuses for its quota, throws ContextFullError.
 */
export function conversation(
  chrome: Session,
  turn: (input: TurnInput, signal: AbortSignal) => AsyncIterable<ModelEvent>,
): ModelSession {
  let requests = 0;
  return {
    async *stream(input, signal) {
      try {
        if (input.kind === 'text') {
          const context = contextOf(chrome);
          if (
            requests > 0 &&
            context &&
            context.used > context.size * FULL_AT
          ) {
            log('the context is full', context);
            throw new ContextFullError();
          }
          requests++;
        }
        yield* turn(input, signal);
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError')
          throw new ContextFullError({cause: error});
        throw error;
      } finally {
        const context = contextOf(chrome);
        if (context) log('context', `${context.used}/${context.size}`);
      }
    },
    destroy: () => {
      log('destroy() the clone');
      chrome.destroy();
    },
  };
}
