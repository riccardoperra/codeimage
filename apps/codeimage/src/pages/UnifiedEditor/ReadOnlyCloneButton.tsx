import {LoadingCircle} from '@codeimage/ui';
import {Button} from '@codeui/kit';

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
      variant="primary"
      disabled={props.pending}
      leftIcon={props.pending ? <LoadingCircle /> : undefined}
      onClick={props.onClick}
    >
      {props.label}
    </Button>
  );
}
