import {useI18n} from '@codeimage/locale';
import {FieldLabel, FlexField, HStack, TextField} from '@codeimage/ui';
import {
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {
  createSignal,
  JSXElement,
  mergeProps,
  onMount,
  VoidProps,
} from 'solid-js';
import {AppLocaleEntries} from '../../i18n';

export interface RenameContentDialogProps extends ControlledDialogProps {
  onConfirm: (name: string) => void;
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
      onOpenChange={props.onOpenChange}
      isOpen={props.isOpen}
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
            // TODO: FIXME: Add @codeui/kit "block support"
            style={{flex: '1'}}
            size={'md'}
            type="button"
            theme={'secondary'}
            onClick={() => props.onOpenChange?.(false)}
          >
            {t('common.close')}
          </Button>

          <Button
            // TODO: FIXME: Add @codeui/kit "block support"
            style={{flex: '1'}}
            size={'md'}
            type="submit"
            theme={'primary'}
            onClick={() => {
              propsWithDefault.onConfirm(name());
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
