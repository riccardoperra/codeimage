import {AuthState} from '@codeimage/store/auth/auth';
import {provideAppState} from '@codeimage/store/index';
import {HStack, Loading, Text, VStack} from '@codeimage/ui';
import {
  As,
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {For, Suspense} from 'solid-js';
import {createResource} from 'solid-js';
import {deletePasskey, listPasskeys} from '../../../data-access/passkey';
import {PencilAlt} from '../../Icons/Pencil';
import {TrashIcon} from '../../Icons/TrashIcon';
import {KeyIcon} from '../../UserBadge/KeyIcon';
import {UserBadge} from '../../UserBadge/UserBadge';
import {
  passkeyItem,
  passkeysBox,
  passkeysBoxTitle,
  passkeysList,
  profileBox,
} from './ProfileDialog.css';

type ProfileDialog = ControlledDialogProps;
export function ProfileDialog(props: ProfileDialog) {
  const authState = provideAppState(AuthState);
  const [passkeys, {mutate, refetch}] = createResource(() => listPasskeys());

  const removePasskey = (id: string) => {
    return deletePasskey({params: {credentialId: id}}).then(() => {
      mutate(passkeys => (passkeys ?? []).filter(passkey => passkey.id !== id));
    });
  };

  return (
    <Dialog
      title={'Profile'}
      open={props.isOpen}
      onOpenChange={open => props.onOpenChange(open)}
      size={'lg'}
    >
      <DialogPanelContent>
        <div class={profileBox}>
          <UserBadge />

          {authState().user?.email}
        </div>
        <div class={passkeysBox}>
          <div class={passkeysBoxTitle}>
            <Text size={'lg'} weight={'semibold'}>
              Passkeys
            </Text>

            <Button
              theme={'primary'}
              disabled={passkeys.loading}
              size={'sm'}
              leftIcon={<KeyIcon size={'sm'} />}
              onClick={() =>
                authState.providers.hanko
                  .registerPasskey()
                  .then(() => refetch())
              }
            >
              Add passkey
            </Button>
          </div>

          <Suspense fallback={<Loading />}>
            <ul class={passkeysList}>
              <For each={passkeys()}>
                {passkey => (
                  <li class={passkeyItem}>
                    {passkey.name}
                    <HStack spacing={'1'}>
                      <IconButton
                        theme={'secondary'}
                        size={'xs'}
                        aria-label={'Delete'}
                        onClick={() => removePasskey(passkey.id)}
                      >
                        <PencilAlt size={'sm'} />
                      </IconButton>

                      <Popover>
                        <PopoverTrigger asChild>
                          <As
                            component={IconButton}
                            theme={'secondary'}
                            size={'xs'}
                            aria-label={'Delete'}
                          >
                            <TrashIcon size={'sm'} />
                          </As>
                        </PopoverTrigger>
                        <PopoverContent>
                          <VStack spacing={'4'}>
                            <Text size={'sm'}>
                              Do you want to delete this passkey from your
                              account?
                            </Text>
                            <div>
                              <Button
                                theme={'negative'}
                                size={'xs'}
                                aria-label={'Delete'}
                                onClick={() => removePasskey(passkey.id)}
                              >
                                Confirm
                              </Button>
                            </div>
                          </VStack>
                        </PopoverContent>
                      </Popover>
                    </HStack>
                  </li>
                )}
              </For>
            </ul>
          </Suspense>
        </div>
      </DialogPanelContent>
      <DialogPanelFooter>
        <Button theme={'secondary'} onClick={() => props.onOpenChange(false)}>
          Close
        </Button>
      </DialogPanelFooter>
    </Dialog>
  );
}
