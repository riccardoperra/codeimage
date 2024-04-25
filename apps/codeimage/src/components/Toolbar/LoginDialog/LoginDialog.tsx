import {AuthState} from '@codeimage/store/auth/auth';
import {provideAppState} from '@codeimage/store/index';
import {Button, Dialog, DialogPanelContent, IconButton} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {GithubLoginButton} from '@ui/GithubLoginButton/GithubLoginButton';
import {CloseIcon} from '../../Icons/CloseIcon';
import {CodeImageLogoV2} from '../../Icons/CodeImageLogoV2';
import {KeyIcon} from '../../UserBadge/KeyIcon';
import {closeIcon, loginBox, titleLogin} from './LoginDialog.css';

export function LoginDialog(props: ControlledDialogProps) {
  const authState = provideAppState(AuthState);
  return (
    <Dialog
      open={props.isOpen}
      onOpenChange={props.onOpenChange}
      size={'xs'}
      id={'loginDialog'}
    >
      <DialogPanelContent>
        <div class={closeIcon}>
          <IconButton aria-label={'close'} theme={'secondary'} pill size={'xs'}>
            <CloseIcon />
          </IconButton>
        </div>
        <div class={titleLogin}>
          <CodeImageLogoV2 width={180} />
        </div>

        <div class={loginBox}>
          <GithubLoginButton />

          <Button
            size={'md'}
            theme={'secondary'}
            leftIcon={<KeyIcon size={'md'} />}
            onClick={() => authState.providers.hanko.login()}
          >
            Login with Passkey
          </Button>
        </div>
      </DialogPanelContent>
    </Dialog>
  );
}
