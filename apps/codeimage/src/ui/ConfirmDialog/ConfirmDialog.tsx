import {useI18n} from '@codeimage/locale';
import {
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  HStack,
  Text,
} from '@codeimage/ui';
import {JSXElement, mergeProps, VoidProps} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';

export interface ConfirmDialogProps {
  onConfirm: () => void;
  onClose?: () => void;
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
      onClose={props.onClose}
      isOpen={true}
    >
      <DialogPanelContent>
        <Text size={'sm'}>{propsWithDefault.message}</Text>
      </DialogPanelContent>
      <DialogPanelFooter>
        <HStack spacing={'2'} justifyContent={'flexEnd'}>
          <Button
            block
            size={'sm'}
            type="button"
            variant={'solid'}
            theme={'secondary'}
            onClick={() => propsWithDefault.onClose?.()}
          >
            {t('common.close')}
          </Button>

          <Button
            block
            size={'sm'}
            type="submit"
            theme={propsWithDefault.actionType}
            variant={'solid'}
            onClick={propsWithDefault.onConfirm}
          >
            {t('common.confirm')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
