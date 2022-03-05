import * as styles from './BottomBar.css';
import {Button} from '../ui/Button/Button';
import {Box} from '../ui/Box/Box';
import {Portal} from 'solid-js/web';
import {Component, createSignal, Show} from 'solid-js';
import {ThemeSwitcher} from '../ThemeSwitcher/ThemeSwitcher';
import {FadeInOutTransition} from '../ui/Transition/Transition';
import {EditorSidebar} from '../LeftSidebar/EditorSidebar';

type Mode = 'themes' | 'style';

interface BottomBarProps {
  portalHostRef: Node | undefined;
}

export const BottomBar: Component<BottomBarProps> = props => {
  const [mode, setMode] = createSignal<Mode | null>(null);

  return (
    <div class={styles.wrapper}>
      <Button
        class={styles.button}
        variant={'link'}
        onClick={() => setMode('themes')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
          />
        </svg>
        <Box as={'span'}>Themes</Box>
      </Button>

      <Button
        class={styles.button}
        variant={'link'}
        onClick={() => setMode('style')}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
        <Box as={'span'}>Style</Box>
      </Button>

      <Button
        class={styles.button}
        disabled={!navigator.share}
        variant={'link'}
        onClick={() =>
          navigator.share({
            title: 'Codeimage Shared code',
            text: 'Codeimage code',
            url: 'https://beta.codeimage.dev',
          })
        }
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
        Editor
      </Button>

      <Show when={props.portalHostRef}>
        <Portal mount={props.portalHostRef}>
          <FadeInOutTransition show={!!mode()}>
            <Box class={styles.portalWrapper}>
              <Box class={styles.portalHeader}>
                <Box marginLeft={'auto'}>
                  <Button
                    size={'xs'}
                    variant={'solid'}
                    theme={'secondary'}
                    onClick={() => setMode(null)}
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
              </Box>
              <Box class={styles.portalContent}>
                <Show when={mode() === 'themes'}>
                  <ThemeSwitcher orientation={'horizontal'} />
                </Show>
                <Show when={mode() === 'style'}>
                  <EditorSidebar />
                </Show>
              </Box>
            </Box>
          </FadeInOutTransition>
        </Portal>
      </Show>
    </div>
  );
};
