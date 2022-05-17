import {Box, Button, FadeInOutTransition} from '@codeimage/ui';
import {createSignal, ParentComponent, Show} from 'solid-js';
import {Portal} from 'solid-js/web';
import {CloseIcon} from '../Icons/CloseIcon';
import {CodeIcon} from '../Icons/Code';
import {ColorSwatchIcon} from '../Icons/ColorSwatch';
import {SparklesIcon} from '../Icons/SparklesIcon';
import {EditorForm} from '../PropertyEditor/EditorForm';
import {EditorStyleForm} from '../PropertyEditor/EditorStyleForm';
import {FrameStyleForm} from '../PropertyEditor/FrameStyleForm';
import {WindowStyleForm} from '../PropertyEditor/WindowStyleForm';
import {ThemeSwitcher} from '../ThemeSwitcher/ThemeSwitcher';
import * as styles from './BottomBar.css';

type Mode = 'themes' | 'style' | 'editor';

interface BottomBarProps {
  portalHostRef: Node | undefined;
}

export const BottomBar: ParentComponent<BottomBarProps> = props => {
  const [mode, setMode] = createSignal<Mode | null>(null);

  return (
    <div class={styles.wrapper}>
      <Button
        class={styles.button}
        variant={'link'}
        onPress={() => setMode('themes')}
      >
        <ColorSwatchIcon />
        <Box as={'span'}>Themes</Box>
      </Button>

      <Button
        class={styles.button}
        variant={'link'}
        onPress={() => setMode('style')}
      >
        <SparklesIcon />
        <Box as={'span'}>Style</Box>
      </Button>

      <Button
        class={styles.button}
        variant={'link'}
        onPress={() => setMode('editor')}
      >
        <CodeIcon />
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
                    pill
                    onPress={() => setMode(null)}
                  >
                    <CloseIcon size={'sm'} />
                  </Button>
                </Box>
              </Box>
              <Box class={styles.portalContent}>
                <Show when={mode() === 'themes'}>
                  <ThemeSwitcher orientation={'horizontal'} />
                </Show>
                <Show when={mode() === 'style'}>
                  <EditorForm>
                    <FrameStyleForm />

                    <WindowStyleForm />
                  </EditorForm>
                </Show>
                <Show when={mode() === 'editor'}>
                  <EditorForm>
                    <EditorStyleForm />
                  </EditorForm>
                </Show>
              </Box>
            </Box>
          </FadeInOutTransition>
        </Portal>
      </Show>
    </div>
  );
};
