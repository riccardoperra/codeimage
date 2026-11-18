import {EditorSelection} from '@codemirror/state';
import {WATERMARK} from '@codeimage/render/watermark';
import type {Rect} from '@codeimage/render/watermark';
import type {EditorView} from '@codemirror/view';
import type {Accessor} from 'solid-js';
import {
  createContext,
  createEffect,
  createSignal,
  flush,
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
  /** Registers a part and returns its detach function. */
  attach<K extends keyof WatermarkParts>(
    part: K,
    value: WatermarkParts[K],
  ): () => void;
  /** Schedules one measurement; repeated calls before it runs coalesce. */
  invalidate(): void;
  /** Settles the placement synchronously after fonts load, for an export. */
  prepare(): Promise<void>;
}

export function codeRoot(source: CodeSource) {
  return source.kind === 'codemirror' ? source.view.contentDOM : source.root;
}

/** Code is measured line by line so full-width line boxes never count as text. */
export function codeRects(
  source: CodeSource,
  staticRects: (line: Element) => Rect[],
): Rect[] {
  if (source.kind === 'static')
    return Array.from(
      source.root.querySelectorAll(`.${WATERMARK.codeClass}`),
    ).flatMap(staticRects);
  const {view} = source;
  const rects: Rect[] = [];
  const push = (from: number, to: number) => {
    const start = view.coordsAtPos(from, 1);
    const end = view.coordsAtPos(to, -1);
    if (!start || !end) return false;
    if (end.top >= start.bottom) return false;
    rects.push({
      x: Math.min(start.left, end.left),
      y: start.top,
      width: Math.abs(end.left - start.left),
      height: start.bottom - start.top,
    });
    return true;
  };
  for (const block of view.viewportLineBlocks) {
    const line = view.state.doc.lineAt(block.from);
    for (const word of line.text.matchAll(/\S+/gu)) {
      const from = line.from + word.index;
      const to = from + word[0].length;
      if (push(from, to)) continue;
      for (let pos = from; pos < to;) {
        const row = view.moveToLineBoundary(
          EditorSelection.cursor(pos, 1),
          true,
        ).head;
        const next = Math.min(to, row > pos ? row : to);
        push(pos, next);
        pos = next;
      }
    }
  }
  return rects;
}

export function createWatermarkScope(): WatermarkScope {
  const [parts, setParts] = createSignal<Partial<WatermarkParts>>(
    {},
    {ownedWrite: true},
  );
  let currentParts: Partial<WatermarkParts> = {};
  const requestKey = {};
  let job: object | undefined;
  let frame = 0;

  const cancel = () => {
    job = undefined;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };

  const invalidate = () => {
    const {measure, code} = currentParts;
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
      currentParts = {...currentParts, [part]: value};
      setParts(currentParts);
      restart();
      return () => {
        if (currentParts[part] !== value) return;
        const next = {...currentParts};
        delete next[part];
        currentParts = next;
        setParts(next);
        restart();
      };
    },
    invalidate,
    async prepare() {
      await document.fonts.ready;
      const {fit, measure} = currentParts;
      if (!measure) return;
      fit?.();
      flush();
      cancel();
      measure()?.();
    },
  };
}

export const WatermarkContext = createContext<WatermarkScope | null>(null);

export function useWatermarkScope() {
  return useContext(WatermarkContext);
}

type ElementPart = {
  [K in keyof WatermarkParts]: WatermarkParts[K] extends HTMLElement
    ? K
    : never;
}[keyof WatermarkParts];

function watermarkRef(
  register: (element: HTMLElement) => (() => void) | undefined,
) {
  const [node, setNode] = createSignal<HTMLElement>();
  createEffect(node, element => {
    if (element) return register(element);
  });
  return setNode;
}

export function createWatermarkRef(
  scope: WatermarkScope | null | undefined,
  part: ElementPart,
) {
  return watermarkRef(element => scope?.attach(part, element));
}

export function useWatermarkPart(part: ElementPart) {
  return createWatermarkRef(useWatermarkScope(), part);
}

export function createStaticWatermarkRef(scope: WatermarkScope | null) {
  return watermarkRef(root => scope?.attach('code', {kind: 'static', root}));
}

const exportScopes = new WeakMap<HTMLElement, WatermarkScope>();

/** Binds the element an export receives to its preview's scope. */
export function bindWatermarkExport(
  target: HTMLElement,
  scope: WatermarkScope,
) {
  exportScopes.set(target, scope);
  return () => {
    if (exportScopes.get(target) === scope) exportScopes.delete(target);
  };
}

export function createWatermarkExportRef(scope: WatermarkScope) {
  return watermarkRef(element => bindWatermarkExport(element, scope));
}

export async function prepareWatermark(target: HTMLElement) {
  await exportScopes.get(target)?.prepare();
}
