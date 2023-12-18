import {AuthState} from '@codeimage/store/auth/auth';
import {provideAppState} from '@codeimage/store/index';
import {Box, VStack} from '@codeimage/ui';
import {
  Button,
  Dialog,
  DialogPanelContent,
  IconButton,
  SvgIcon,
} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {GithubLoginButton} from '@ui/GithubLoginButton/GithubLoginButton';
import {CloseIcon} from '../../Icons/CloseIcon';
import {CodeImageLogoV2} from '../../Icons/CodeImageLogoV2';
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
            size={'lg'}
            theme={'secondary'}
            leftIcon={
              <SvgIcon
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                size={'1.15rem'}
              >
                <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z" />
                <circle cx="16.5" cy="7.5" r=".5" />
              </SvgIcon>
            }
            onClick={() => authState.providers.hanko.login()}
          >
            Login with Passkey
          </Button>
        </div>
      </DialogPanelContent>
    </Dialog>
  );
}
