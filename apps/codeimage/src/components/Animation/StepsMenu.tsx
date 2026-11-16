import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownSubMenu,
  DropdownSubMenuTrigger,
  DropdownSubMenuContent,
} from '@codeui/kit';
import {For, onCleanup, Show} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';
import * as styles from './StepsMenu.css';
function AddStepItem(props: {id: string; name: string}) {
  const {animation} = getEditorStore();
  const add = () => animation.actions.addStep(props.id);
  return <DropdownMenuItem onSelect={add}>{props.name}</DropdownMenuItem>;
}
export function StepsMenu() {
  const {animation, editor} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const index = () =>
    animation
      .settings()
      .steps.findIndex(step => step.id === animation.selection()?.stepId);
  const id = () => animation.settings().steps[index()]?.id;
  const duplicateDisabled = () => index() < 0 && editor.computed.canAddEditor();
  let editDuplicate: number | undefined;
  onCleanup(() => {
    editDuplicate = undefined;
  });
  const closeAutoFocus = (event: Event) => {
    if (editDuplicate === undefined) return;
    event.preventDefault();
    queueMicrotask(() => {
      if (editDuplicate === undefined) return;
      animation.actions.editStep(editDuplicate);
      editDuplicate = undefined;
    });
  };
  const duplicate = () => {
    const stepId = id();
    if (stepId && editor.computed.canAddEditor()) {
      editDuplicate = index() + 1;
      animation.actions.duplicateAsNext(stepId);
    }
  };
  const earlier = () => {
    const stepId = id();
    if (stepId) animation.actions.moveStep(stepId, -1);
  };
  const later = () => {
    const stepId = id();
    if (stepId) animation.actions.moveStep(stepId, 1);
  };
  const remove = () => {
    const stepId = id();
    if (stepId) animation.actions.removeStep(stepId);
  };
  return (
    <DropdownMenu placement="top-end">
      <DropdownMenuTrigger as={Button} size="xs" theme="secondary">
        {t('animation.steps')}
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          onCloseAutoFocus={closeAutoFocus}
          data-animation-steps-menu
        >
          <DropdownSubMenu>
            <DropdownSubMenuTrigger>
              {t('animation.addStep')}
            </DropdownSubMenuTrigger>
            <DropdownMenuPortal>
              <DropdownSubMenuContent data-animation-steps-menu>
                <For each={editor.state.editors}>
                  {tab => (
                    <AddStepItem
                      id={tab.id}
                      name={tab.tab.tabName || t('animation.untitledTab')}
                    />
                  )}
                </For>
              </DropdownSubMenuContent>
            </DropdownMenuPortal>
          </DropdownSubMenu>
          <DropdownMenuItem
            disabled={duplicateDisabled()}
            aria-disabled={!editor.computed.canAddEditor() || undefined}
            aria-label={t('animation.duplicate')}
            aria-describedby={
              !editor.computed.canAddEditor()
                ? 'animation-duplicate-limit'
                : undefined
            }
            class={styles.duplicate}
            onSelect={duplicate}
          >
            <span>{t('animation.duplicate')}</span>
            <Show when={!editor.computed.canAddEditor()}>
              <span id="animation-duplicate-limit" class={styles.hint}>
                {t('animation.duplicateLimit')}
              </span>
            </Show>
          </DropdownMenuItem>
          <DropdownMenuItem disabled={index() <= 0} onSelect={earlier}>
            {t('animation.moveEarlier')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={
              index() < 0 || index() === animation.settings().steps.length - 1
            }
            onSelect={later}
          >
            {t('animation.moveLater')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={index() < 0 || animation.settings().steps.length === 1}
            onSelect={remove}
          >
            {t('animation.remove')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
