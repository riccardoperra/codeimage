import {AuthState} from '@codeimage/store/auth/auth';
import {provideAppState} from '@codeimage/store/index';
import {VStack} from '@codeimage/ui';
import {Button, Dialog, DialogPanelContent} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {GithubLoginButton} from '@ui/GithubLoginButton/GithubLoginButton';

export function LoginDialog(props: ControlledDialogProps) {
  const authState = provideAppState(AuthState);
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange} size={'xs'}>
      <DialogPanelContent>
        <VStack spacing={3}>
          <GithubLoginButton />

          <Button
            size={'sm'}
            theme={'secondary'}
            onClick={() => authState.providers.hanko.login()}
          >
            Login with Passkey
          </Button>
        </VStack>
      </DialogPanelContent>
    </Dialog>
  );
}
