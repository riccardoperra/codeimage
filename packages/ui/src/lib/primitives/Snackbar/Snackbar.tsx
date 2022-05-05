import clsx from 'clsx';
import {createSignal, JSX, Show} from 'solid-js';
import {Toast} from 'solid-headless';
import {SnackbarData} from './SnackbarHost';
import * as styles from './Snackbar.css';
import {Dynamic} from 'solid-js/web';
import {FadeInOutWithScaleTransition} from '../Transition';
import {Box} from '../Box';
import {Text} from '../Text';
import {Button} from '../Button';
import {SvgIcon} from '../Icon';
import {useSnackbarStore} from './snackbar.store';

export function SnackBar(props: SnackbarData & {id: string}): JSX.Element {
  const store = useSnackbarStore();
  const [isOpen, setIsOpen] = createSignal(true);

  function dismiss() {
    setIsOpen(() => false);
  }

  return (
    <FadeInOutWithScaleTransition
      show={isOpen()}
      afterLeave={() => store.remove(props.id)}
    >
      <Box as={props.wrapper ?? 'div'}>
        <Toast class={clsx(styles.snackbar)}>
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
                pill
                variant={'solid'}
                theme={'secondary'}
                onClick={dismiss}
              >
                <SvgIcon
                  xmlns="http://www.w3.org/2000/svg"
                  size={'xs'}
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
                </SvgIcon>
              </Button>
            </Box>
          </Show>
        </Toast>
      </Box>
    </FadeInOutWithScaleTransition>
  );
}
