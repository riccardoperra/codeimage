import {createSignal, JSX, Show} from 'solid-js';
import {Toast, Transition} from 'solid-headless';
import {notificationStore, SnackbarData} from './SnackbarHost';
import * as styles from './Snackbar.css';
import {Dynamic} from 'solid-js/web';
import {Text} from '../Text/Text';
import {Box} from '../Box/Box';

function CloseIcon(props: JSX.IntrinsicElements['svg']): JSX.Element {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      {...props}
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

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
          {props.message}
        </Text>

        <Show when={!!props.actions}>
          <Box marginLeft={'4'}>
            <Dynamic component={props.actions} />
          </Box>
        </Show>
        <Show when={props.closeable}>
          <button
            type="button"
            class="flex-none w-6 h-6 p-1 text-white bg-blue-900 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75"
            onClick={dismiss}
          >
            <CloseIcon />
          </button>
        </Show>
      </Toast>
    </Transition>
  );
}
