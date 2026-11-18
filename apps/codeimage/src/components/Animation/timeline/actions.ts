import {getEditorStore} from '@codeimage/store/editor';
import {createSignal} from 'solid-js';
import {addScriptStep, deleteScriptStep} from '../scriptActions';
import type {TimelineStep} from './model';
import {exit, flip} from './motion';
let root: HTMLElement | undefined;
export const registerRoot = (element: HTMLElement | undefined) => {
  root = element;
  return () => {
    if (root === element) root = undefined;
  };
};

const itemOf = (key: string) =>
  root?.querySelector(`[data-flip="${CSS.escape(key)}"]`);

export function timelineActions() {
  const store = getEditorStore();
  const {animation, editor} = store;
  const tabCount = () => editor.state.editors.length;
  return {
    canAddTab: () => editor.computed.canAddEditor(),
    addTab: () => flip(root, () => animation.actions.addTab()),
    addStep: (editorId: string) =>
      flip(root, () => addScriptStep(store, editorId)),
    canRemoveStep: (step: TimelineStep) =>
      step.source.kind === 'script' || tabCount() > 1,
    removeStep: (step: TimelineStep) =>
      exit(root, itemOf(`step:${step.stepId}`), () => {
        if (step.source.kind === 'script')
          deleteScriptStep(store, step.editorId, step.source.step);
        else animation.actions.closeTab(step.editorId);
      }),
    canRemoveTab: () => tabCount() > 1,
    removeTab: (editorId: string) =>
      exit(root, itemOf(`tab:${editorId}`), () =>
        animation.actions.closeTab(editorId),
      ),
    moveTab: (editorId: string, to: number) =>
      flip(root, () => animation.actions.moveTab(editorId, to)),
    tabCount,
  };
}

export type MenuAnchor = {x: number; y: number} | null;
export const [menuAnchor, setMenuAnchor] = createSignal<MenuAnchor>(null);
export const [menuOpen, setMenuOpen] = createSignal(false);

export function openStepMenu(event: MouseEvent, select: () => void) {
  event.preventDefault();
  select();
  setMenuAnchor({x: event.clientX, y: event.clientY});
  setMenuOpen(true);
}
