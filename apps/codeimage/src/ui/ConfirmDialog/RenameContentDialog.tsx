import {useI18n} from '@codeimage/locale';
import {
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  FieldLabel,
  FlexField,
  HStack,
  TextField,
} from '@codeimage/ui';
import {
  createSignal,
  JSXElement,
  mergeProps,
  onMount,
  VoidProps,
} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';

export interface RenameContentDialogProps {
  onConfirm: (name: string) => void;
  onClose?: () => void;
  message: JSXElement;
  title: string;
  initialValue?: string;
}

export function RenameContentDialog(
  props: VoidProps<RenameContentDialogProps>,
): JSXElement {
  const [t] = useI18n<AppLocaleEntries>();
  const [name, setName] = createSignal(props.initialValue ?? '');
  let textField!: HTMLInputElement;

  onMount(() => {
    requestAnimationFrame(() => {
      textField?.focus();
      textField?.select();
    });
  });

  const propsWithDefault = mergeProps({actionType: 'primary'} as const, props);
  return (
    <Dialog
      size={'xs'}
      title={propsWithDefault.title}
      onClose={props.onClose}
      isOpen={true}
    >
      <DialogPanelContent>
        <FlexField size={'lg'}>
          {/*// TODO: add support for weight*/}
          <FieldLabel size={'sm'}>{propsWithDefault.message}</FieldLabel>
          <TextField
            ref={textField}
            type={'text'}
            value={name()}
            onChange={setName}
            autofocus={true}
          />
        </FlexField>
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
            onClick={() => propsWithDefault.onConfirm(name())}
          >
            {t('common.confirm')}
          </Button>
        </HStack>
      </DialogPanelFooter>
    </Dialog>
  );
}
