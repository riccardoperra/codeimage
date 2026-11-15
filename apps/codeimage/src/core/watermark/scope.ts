import type {EditorView} from '@codemirror/view';
import type {Accessor} from 'solid-js';
import {
  createContext,
  createSignal,
  onCleanup,
  untrack,
  useContext,
} from 'solid-js';

export type CodeSource =
  | {kind: 'static'; root: HTMLElement}
  | {kind: 'codemirror'; view: EditorView};

type WritePlacement = () => void;

/** What one framed window registers for its watermark. */
export interface WatermarkParts {
  frame: HTMLElement;
  background: HTMLElement;
  signature: HTMLElement;
  window: HTMLElement;
  content: HTMLElement;
  header: HTMLElement;
  code: CodeSource;
  /** Applies the fitted-window transform synchronously. */
  fit: () => void;
  /** Reads the scene and returns the write, or nothing when it cannot place. */
  measure: () => WritePlacement | undefined;
}

export interface WatermarkScope {
  parts: Accessor<Partial<WatermarkParts>>;
  /** Registers a part until the current owner is disposed. */
  attach<K extends keyof WatermarkParts>(
    part: K,
    value: WatermarkParts[K],
  ): void;
  /** Schedules one measurement; repeated calls before it runs coalesce. */
  invalidate(): void;
  /** Settles the placement synchronously after fonts load, for an export. */
  prepare(): Promise<void>;
}

export function codeRoot(source: CodeSource) {
  return source.kind === 'codemirror' ? source.view.contentDOM : source.root;
}

/** Code is measured line by line so full-width line boxes never count as text. */
export function codeLines(source: CodeSource) {
  return Array.from(codeRoot(source).querySelectorAll('.cm-line'));
}

export function createWatermarkScope(): WatermarkScope {
  const [parts, setParts] = createSignal<Partial<WatermarkParts>>({});
  const requestKey = {};
  let job: object | undefined;
  let frame = 0;

  const cancel = () => {
    job = undefined;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const invalidate = () => {
    const {measure, code} = untrack(parts);
    if (job || !measure) return;
    const token = (job = {});
    const write = (apply: WritePlacement | undefined) => {
      if (job !== token) return;
      job = undefined;
      apply?.();
    };
    if (code?.kind === 'codemirror')
      code.view.requestMeasure({
        key: requestKey,
        read: () => (job === token ? measure() : undefined),
        write,
      });
    else
      frame = requestAnimationFrame(() =>
        write(job === token ? measure() : undefined),
      );
  };

  // A queued job belongs to the parts it was scheduled with, so any change
  // drops it. A destroyed editor would otherwise never run its request.
  const restart = () => {
    cancel();
    invalidate();
  };

  return {
    parts,
    attach(part, value) {
      setParts(current => ({...current, [part]: value}));
      restart();
      onCleanup(() => {
        setParts(current => {
          if (current[part] !== value) return current;
          const next = {...current};
          delete next[part];
          return next;
        });
        restart();
      });
    },
    invalidate,
    async prepare() {
      await document.fonts.ready;
      const {fit, measure} = untrack(parts);
      if (!measure) return;
      fit?.();
      cancel();
      measure()?.();
    },
  };
}

export const WatermarkContext = createContext<WatermarkScope>();

export function useWatermarkScope() {
  return useContext(WatermarkContext);
}

type ElementPart = {
  [K in keyof WatermarkParts]: WatermarkParts[K] extends HTMLElement
    ? K
    : never;
}[keyof WatermarkParts];

/** A ref that registers the element when the component renders inside a frame. */
export function useWatermarkPart(part: ElementPart) {
  const scope = useWatermarkScope();
  return (element: HTMLElement) => scope?.attach(part, element);
}

const exportScopes = new WeakMap<HTMLElement, WatermarkScope>();

/** Binds the element an export receives to its preview's scope. */
export function bindWatermarkExport(
  target: HTMLElement,
  scope: WatermarkScope,
) {
  exportScopes.set(target, scope);
  onCleanup(() => {
    if (exportScopes.get(target) === scope) exportScopes.delete(target);
  });
}

export async function prepareWatermark(target: HTMLElement) {
  await exportScopes.get(target)?.prepare();
}
