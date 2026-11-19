import {createTimelineInputRef} from './input';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button, IconButton} from '@codeimage/ui';
import {Dialog, DialogTitle} from '@ui/Dialog';
import {createEffect, createMemo, createSignal} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {CloseIcon} from '../../Icons/CloseIcon';
import {StepToolbar} from './StepToolbar';
import type {TimelineModel} from './model';
import * as styles from './toolbar.css';

export function MobileDetails(props: {model: TimelineModel}) {
  const {animation} = getEditorStore();
  const inputRef = createTimelineInputRef();
  const [t] = useI18n<AppLocaleEntries>();
  const [open, setOpen] = createSignal(false);
  const selected = () => animation.selection();
  const selectedKey = createMemo(() => {
    const value = selected();
    return value ? `${value.kind}:${value.stepId}` : null;
  });
  createEffect(
    selectedKey,
    value => {
      setOpen(!!value?.startsWith('hold:'));
    },
    {
      defer: true,
    },
  );
  const title = () =>
    props.model.stepOf(selected()?.stepId ?? '')?.label ?? t('animation.steps');
  const close = () => setOpen(false);
  return (
    <>
      <Button
        class={styles.button}
        size="sm"
        theme="secondary"
        disabled={!selected()}
        onClick={() => setOpen(true)}
      >
        {title()}
      </Button>
      <Dialog
        open={open()}
        onOpenChange={setOpen}
        class={styles.sheet}
        onCloseAutoFocus={event => {
          event.preventDefault();
          props.model
            .viewport()
            ?.element.querySelector<HTMLElement>(
              '[data-nav="hold:' + CSS.escape(selected()?.stepId ?? '') + '"]',
            )
            ?.focus({preventScroll: true});
        }}
      >
        <div ref={inputRef} class={styles.sheetBody} data-animation-step-sheet>
          <div class={styles.sheetHead}>
            <DialogTitle class={styles.sheetTitle}>{title()}</DialogTitle>
            <IconButton
              class={styles.button}
              size="sm"
              theme="secondary"
              aria-label={t('animation.closeStep')}
              onClick={close}
            >
              <CloseIcon />
            </IconButton>
          </div>
          <StepToolbar model={props.model} />
        </div>
      </Dialog>
    </>
  );
}
