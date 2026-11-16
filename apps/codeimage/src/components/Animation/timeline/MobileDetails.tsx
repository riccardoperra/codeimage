import {trackTimelineInput} from './motion';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button, IconButton} from '@codeui/kit';
import {Dialog, Content as DialogContent} from '@kobalte/core/dialog';
import {createEffect, createMemo, createSignal, on} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {CloseIcon} from '../../Icons/CloseIcon';
import {StepToolbar} from './StepToolbar';
import type {TimelineModel} from './model';
import * as styles from './toolbar.css';

export function MobileDetails(props: {model: TimelineModel}) {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const [open, setOpen] = createSignal(false);
  const selected = () => animation.selection();
  const selectedKey = createMemo(() => {
    const value = selected();
    return value ? `${value.kind}:${value.stepId}` : null;
  });
  createEffect(
    on(selectedKey, value => setOpen(!!value?.startsWith('hold:')), {
      defer: true,
    }),
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
      <Dialog open={open()} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay class={styles.sheetOverlay} />
          <DialogContent
            ref={trackTimelineInput}
            class={styles.sheet}
            data-animation-step-sheet
            onCloseAutoFocus={event => {
              event.preventDefault();
              props.model
                .viewport()
                ?.element.querySelector<HTMLElement>(
                  `[data-nav="hold:${CSS.escape(selected()?.stepId ?? '')}"]`,
                )
                ?.focus({preventScroll: true});
            }}
          >
            <div class={styles.sheetHead}>
              <Dialog.Title class={styles.sheetTitle}>{title()}</Dialog.Title>
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
          </DialogContent>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
