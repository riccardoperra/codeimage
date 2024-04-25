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
  TextField,
} from '@codeui/kit';
import {icons} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {For, Show, Suspense, createResource, createSignal} from 'solid-js';
import {
  deletePasskey,
  editPasskey,
  listPasskeys,
} from '../../../data-access/passkey';
import {CloseIcon} from '../../Icons/CloseIcon';
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

  const confirmEditPasskey = (id: string, newName: string) => {
    return editPasskey({
      body: {name: newName},
      params: {credentialId: id},
    }).then(() => {
      mutate(passkeys =>
        (passkeys ?? []).map(passkey => {
          if (passkey.id === id) {
            passkey.name = newName;
            return {...passkey};
          }
          return {passkey};
        }),
      );
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
                {passkey => {
                  const [editing, setEditing] = createSignal(false);
                  const [currentValue, setCurrentValue] = createSignal(
                    passkey.name,
                  );

                  return (
                    <li class={passkeyItem}>
                      <Show fallback={passkey.name} when={editing()}>
                        <TextField
                          ref={el => (el.autofocus = true)}
                          size={'xs'}
                          defaultValue={passkey.name}
                          onChange={setCurrentValue}
                        />
                      </Show>

                      <HStack spacing={'1'}>
                        <Show
                          fallback={
                            <>
                              <IconButton
                                theme={'secondary'}
                                size={'xs'}
                                aria-label={'Edit passkey'}
                                onClick={() => setEditing(true)}
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
                                      Do you want to delete this passkey from
                                      your account?
                                    </Text>
                                    <div>
                                      <Button
                                        theme={'negative'}
                                        size={'xs'}
                                        aria-label={'Delete'}
                                        onClick={() =>
                                          removePasskey(passkey.id)
                                        }
                                      >
                                        Confirm
                                      </Button>
                                    </div>
                                  </VStack>
                                </PopoverContent>
                              </Popover>
                            </>
                          }
                          when={editing()}
                        >
                          <IconButton
                            theme={'secondary'}
                            size={'xs'}
                            aria-label={'Delete'}
                            onClick={() => {
                              setEditing(false);
                              setCurrentValue(passkey.name);
                            }}
                          >
                            <CloseIcon size={'sm'} />
                          </IconButton>

                          <IconButton
                            theme={'tertiary'}
                            size={'xs'}
                            aria-label={'Confirm'}
                            onClick={() => {
                              setEditing(false);
                              confirmEditPasskey(passkey.id, currentValue());
                            }}
                          >
                            <icons.CheckIcon size={'1rem'} />
                          </IconButton>
                        </Show>
                      </HStack>
                    </li>
                  );
                }}
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
