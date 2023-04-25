import {useI18n} from '@codeimage/locale';
import {HStack, Text} from '@codeimage/ui';
import {Dialog, DialogPanelContent, DialogPanelFooter} from '@codeui/kit';
import {Button} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {JSXElement, mergeProps, VoidProps} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';

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
  const propsWithDefault = mergeProps({actionType: 'primary'} as const, props);
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
            theme={'secondary'}
            onClick={() => props.onOpenChange?.(false)}
          >
            {t('common.close')}
          </Button>

          <Button
            block
            size={'md'}
            type="submit"
            theme={
              propsWithDefault.actionType === 'primary' ? 'primary' : 'negative'
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
