import {useI18n} from '@codeimage/locale';
import {FieldLabel, FlexField, HStack} from '@codeimage/ui';
import {
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  TextField,
} from '@codeui/kit';
import {type ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {
  createSignal,
  type JSXElement,
  mergeProps,
  type VoidProps,
} from 'solid-js';
import {type AppLocaleEntries} from '../../i18n';

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

  const propsWithDefault = mergeProps({actionType: 'primary'} as const, props);
  return (
    <Dialog
      size={'xs'}
      title={propsWithDefault.title}
      onOpenChange={props.onOpenChange}
      open={props.isOpen}
    >
      <DialogPanelContent>
        <FlexField size={'lg'}>
          {/*// TODO: add support for weight*/}
          <FieldLabel size={'sm'}>{propsWithDefault.message}</FieldLabel>
          <TextField
            ref={el => {
              el.autofocus = true;
              setTimeout(() => el?.focus(), 0);
            }}
            onChange={setName}
            value={name()}
          />
        </FlexField>
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
