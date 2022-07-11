import {getAuthState} from '@codeimage/store/auth/auth';
import {Button, DropdownMenuV2, MenuButton} from '@codeimage/ui';
import {supabase} from '@core/constants/supabase';
import {Item} from '@solid-aria/collection';
import {
  createOverlayTriggerState,
  OverlayContainer,
} from '@solid-aria/overlays';
import {useNavigate} from 'solid-app-router';
import {createComponent, getOwner, runWithOwner, Show} from 'solid-js';
import {DotHorizontalIocn} from '../Icons/DotVertical';
import {SettingsDialog} from './SettingsDialog';

export function ToolbarSettingsButton() {
  const navigate = useNavigate();
  const owner = getOwner();

  const onMenuAction = (item: string | number) => {
    switch (item) {
      case 'logout':
        supabase.auth.signOut().then(() => navigate('/'));
        break;
      case 'settings': {
        runWithOwner(owner!, () => {
          const overlayState = createOverlayTriggerState({});
          overlayState.open();
          createComponent(Show, {
            get when() {
              return overlayState.isOpen();
            },
            get children() {
              return createComponent(OverlayContainer, {
                get children() {
                  return createComponent(SettingsDialog, {
                    onClose: () => {
                      overlayState.close();
                      console.log('close');
                    },
                  });
                },
              });
            },
          });
        });
        break;
      }
    }
  };

  return (
    <DropdownMenuV2
      onAction={item => onMenuAction(item)}
      menuButton={
        <MenuButton
          as={Button}
          pill={true}
          style={{width: '30px', height: '30px'}}
          variant={'solid'}
          size={'xs'}
          theme={'secondary'}
        >
          <DotHorizontalIocn />
        </MenuButton>
      }
    >
      <Item key={'settings'}>Settings</Item>
      <Show when={getAuthState().loggedIn()}>
        <Item key={'logout'}>Logout</Item>
      </Show>
    </DropdownMenuV2>
  );
}
