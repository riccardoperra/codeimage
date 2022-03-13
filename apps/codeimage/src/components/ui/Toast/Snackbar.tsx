import {createSignal, JSX, Show} from 'solid-js';
import {Toast, Transition} from 'solid-headless';
import {notificationStore, SnackbarData} from './SnackbarHost';
import * as styles from './Snackbar.css';
import {Dynamic} from 'solid-js/web';
import {Text} from '../Text/Text';
import {Box} from '../Box/Box';
import {Button} from '../Button/Button';

export function SnackBar(props: SnackbarData & {id: string}): JSX.Element {
  const [isOpen, setIsOpen] = createSignal(true);

  function dismiss() {
    setIsOpen(() => false);
  }

  return (
    <Transition
      show={isOpen()}
      class="relative transition bg-opacity-25"
      enter="ease-out duration-300"
      enterFrom="opacity-0 scale-50"
      enterTo="opacity-100 scale-100"
      leave="ease-in duration-200"
      leaveFrom="opacity-100 scale-100"
      leaveTo="opacity-0 scale-50"
      afterLeave={() => notificationStore.remove(props.id)}
    >
      <Toast class={styles.toast}>
        <Text size={'sm'} weight={'semibold'}>
          {typeof props.message === 'string' ? (
            props.message
          ) : (
            <Dynamic component={props.message} />
          )}
        </Text>

        <Show when={!!props.actions}>
          <Box marginLeft={'4'}>
            <Dynamic component={props.actions} />
          </Box>
        </Show>
        <Show when={props.closeable}>
          <Box marginLeft={'4'}>
            <Button
              type={'button'}
              size={'xs'}
              variant={'solid'}
              theme={'secondary'}
              onClick={dismiss}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          </Box>
        </Show>
      </Toast>
    </Transition>
  );
}
