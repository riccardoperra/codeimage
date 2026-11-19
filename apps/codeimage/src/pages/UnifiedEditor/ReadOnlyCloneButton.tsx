import {LoadingCircle} from '@codeimage/ui';
import {Button} from '@ui/legacy-controls';

export function ReadOnlyCloneButton(props: {
  label: string;
  pending: boolean;
  buttonClass: string;
  onClick(): void;
}) {
  return (
    <Button
      class={props.buttonClass}
      size="sm"
      theme="primary"
      disabled={props.pending}
      leftIcon={props.pending ? <LoadingCircle /> : undefined}
      onClick={props.onClick}
    >
      {props.label}
    </Button>
  );
}
