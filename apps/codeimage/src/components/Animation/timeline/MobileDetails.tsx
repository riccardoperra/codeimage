import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import {Button, IconButton} from '@codeui/kit';
import {Dialog, Content as DialogContent} from '@kobalte/core/dialog';
import {createEffect, createSignal, on} from 'solid-js';
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
  createEffect(
    on(
      () => {
        const value = selected();
        return value ? `${value.kind}:${value.stepId}` : null;
      },
      value => setOpen(!!value?.startsWith('hold:')),
      {defer: true},
    ),
  );
  const title = () =>
    props.model.stepOf(selected()?.stepId ?? '')?.label ?? t('animation.steps');
  const close = () => setOpen(false);
  return (
    <>
      <Button
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
            class={styles.sheet}
            data-animation-step-sheet
            onCloseAutoFocus={event => {
              event.preventDefault();
              document
                .querySelector<HTMLElement>(
                  `[data-nav="hold:${CSS.escape(selected()?.stepId ?? '')}"]`,
                )
                ?.focus({preventScroll: true});
            }}
          >
            <div class={styles.sheetHead}>
              <Dialog.Title>{title()}</Dialog.Title>
              <IconButton
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
