import clsx from 'clsx';
import {Toast} from 'solid-headless';
import {createSignal, JSX, Show} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {Box} from '../Box';
import {Button} from '../Button';
import {ButtonSizes} from '../Button/Button.css';
import {SvgIcon} from '../Icon';
import {Text} from '../Text';
import {FadeInOutWithScaleTransition} from '../Transition';
import * as styles from './Snackbar.css';
import {SnackbarData, toast} from './SnackbarHost';

export function SnackBar(props: SnackbarData & {id: string}): JSX.Element {
  const [isOpen, setIsOpen] = createSignal(true);

  function dismiss() {
    setIsOpen(() => false);
  }

  return (
    <FadeInOutWithScaleTransition
      show={isOpen()}
      afterLeave={() => toast.remove(props.id)}
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
            <Box marginLeft={4}>
              <Dynamic component={props.actions} />
            </Box>
          </Show>
          <Show when={props.closeable}>
            <Box marginLeft={4}>
              <Button
                type={'button'}
                size={ButtonSizes.xs}
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
