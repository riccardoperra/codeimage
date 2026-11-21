import {useI18n} from '@codeimage/locale';
import type {AppLocaleEntries} from '../../i18n';
import {getAuth0State} from '@codeimage/store/auth/auth0';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@ui/DropdownMenu';
import {IconButton} from '@codeui/kit';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {useNavigate} from '@solidjs/router';
import {Show} from 'solid-js';
import {MenuAlt2Icon} from '../Icons/DotVertical';
import {ExternalLinkIcon} from '../Icons/ExternalLink';
import {SettingsDialog} from './SettingsDialog';

export function ToolbarSettingsButton() {
  const [t] = useI18n<AppLocaleEntries>();
  const navigate = useNavigate();
  const openDialog = createControlledDialog();
  const {signOut, loggedIn} = getAuth0State();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        as={IconButton}
        pill={true}
        size={'xs'}
        variant={'secondary'}
        aria-label={'Menu'}
      >
        <MenuAlt2Icon size={'sm'} />
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent>
          <DropdownMenuItem
            onClick={() => openDialog(SettingsDialog, () => ({}))}
          >
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem
            as="a"
            href="https://github.com/riccardoperra/codeimage/releases"
            target="_blank"
            rel="noreferrer"
            style={{'text-decoration': 'unset'}}
          >
            {t('editor.whatsNew')}
          </DropdownMenuItem>
          <DropdownMenuItem
            rightSlot={<ExternalLinkIcon />}
            as={'a'}
            target={'_blank'}
            // TODO: add codeui dropdownMenuItemLink style
            style={{'text-decoration': 'unset'}}
            href={'https://github.com/riccardoperra/codeimage'}
          >
            GitHub
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
