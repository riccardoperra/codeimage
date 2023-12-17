import {AuthState} from '@codeimage/store/auth/auth';
import {provideAppState} from '@codeimage/store/index';

import {
  As,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  IconButton,
} from '@codeui/kit';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {useNavigate} from '@solidjs/router';
import {Show} from 'solid-js';
import {Changelog} from '../Changelog/Changelog';
import {MenuAlt2Icon} from '../Icons/DotVertical';
import {ExternalLinkIcon} from '../Icons/ExternalLink';
import {SettingsDialog} from './SettingsDialog';

export function ToolbarSettingsButton() {
  const navigate = useNavigate();
  const openDialog = createControlledDialog();
  const {signOut, loggedIn} = provideAppState(AuthState);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <As
          component={IconButton}
          pill={true}
          size={'xs'}
          theme={'secondary'}
          aria-label={'Menu'}
        >
          <MenuAlt2Icon size={'sm'} />
        </As>
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => openDialog(SettingsDialog, () => ({}))}
          >
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => openDialog(Changelog, {})}>
            Changelog
          </DropdownMenuItem>
          <DropdownMenuItem rightSlot={<ExternalLinkIcon />} asChild>
            <As
              component={'a'}
              target={'_blank'}
              // TODO: add codeui dropdownMenuItemLink style
              style={{'text-decoration': 'unset'}}
              href={'https://github.com/riccardoperra/codeimage'}
            >
              Github
            </As>
          </DropdownMenuItem>

          <Show when={loggedIn()}>
            <DropdownMenuItem
              onClick={() => signOut().then(() => navigate('/'))}
            >
              Logout
            </DropdownMenuItem>
          </Show>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
