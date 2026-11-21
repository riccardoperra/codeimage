import {useI18n} from '@codeimage/locale';
import {HStack, Text} from '@codeimage/ui';
import {Dialog, DialogPanelContent, DialogPanelFooter} from '@ui/Dialog';
import {Button} from '@codeui/kit';
import type {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import type {Element as JSXElement, VoidProps} from 'solid-js';
import {merge} from 'solid-js';
import type {AppLocaleEntries} from '../../i18n';

interface ConfirmDialogProps extends ControlledDialogProps {
  onConfirm: () => void;
  title: string;
  message: JSXElement;
  actionType?: 'primary' | 'danger';
}

export function ConfirmDialog(
  props: VoidProps<ConfirmDialogProps>,
): JSXElement {
  const [t] = useI18n<AppLocaleEntries>();
  const propsWithDefault = merge({actionType: 'primary'} as const, props);
  return (
    <Dialog
      size={'xs'}
      title={propsWithDefault.title}
      onOpenChange={propsWithDefault.onOpenChange}
      open={propsWithDefault.isOpen}
    >
      <DialogPanelContent>
        <Text size={'sm'}>{propsWithDefault.message}</Text>
      </DialogPanelContent>
      <DialogPanelFooter>
        <HStack spacing={'2'} justifyContent={'flexEnd'}>
          <Button
            block
            size={'md'}
            type="button"
            variant={'secondary'}
            onClick={() => props.onOpenChange?.(false)}
          >
            {t('common.close')}
          </Button>

          <Button
            block
            size={'md'}
            type="submit"
            variant={
              propsWithDefault.actionType === 'danger' ? 'negative' : 'primary'
            }
            onClick={() => {
              propsWithDefault.onConfirm();
              propsWithDefault.onOpenChange(false);
            }}
          >
            {t('common.confirm')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
