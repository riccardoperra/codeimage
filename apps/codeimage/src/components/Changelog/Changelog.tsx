import {Box} from '@codeimage/ui';
import {
  Button,
  Dialog,
  DialogPanelContent,
  DialogPanelFooter,
  Link,
} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {
  Component,
  createSignal,
  For,
  Show,
  Suspense,
  SuspenseList,
} from 'solid-js';
import {mdxComponents} from '../../mdx/components';
import * as styles from './Changelog.css';
import {ChangelogItem} from './ChangelogItem';
import {resolveChangelog} from './resolveChangelog';

const ChangelogFiles = import.meta.glob('../../../changelog/*.mdx');

type ChangelogProp = ControlledDialogProps & {
  latest?: boolean;
  paginated?: boolean;
  onClose?: () => void;
};

export const changelogFileEntries = Object.entries(ChangelogFiles)
  .map(([path, file]) => {
    const {version, date, Component} = resolveChangelog({
      path,
      component: file as () => Promise<{default: Component}>,
    });
    return {
      version,
      date,
      Component,
    };
  })
  .sort((a, b) => (a.date().getTime() - b.date().getTime() ? -1 : 1));

export function Changelog(props: ChangelogProp) {
  const changelogEntries = () => {
    if (props.latest) {
      return [changelogFileEntries[0]];
    }
    return changelogFileEntries;
  };

  const [currentIndex, setCurrentIndex] = createSignal(0);

  const previous = () => {
    if (currentIndex() === 0) return null;
    return changelogEntries()[currentIndex() - 1];
  };

  const next = () => {
    return changelogEntries()[currentIndex() + 1];
  };

  const entries = () => {
    if (!props.paginated) {
      return changelogEntries();
    }
    const entry =
      changelogEntries().at(currentIndex()) ?? changelogEntries()[0];
    return [entry];
  };
  return (
    <Dialog
      title={"🎉 What's new"}
      open={props.isOpen}
      size={'xl'}
      onOpenChange={open => {
        props.onOpenChange(open);
        if (!open) props.onClose?.();
      }}
    >
      <DialogPanelContent>
        <SuspenseList revealOrder={'forwards'}>
          <div class={styles.changelogList}>
            <For each={entries()}>
              {(data, index) => {
                return (
                  <Suspense>
                    <ChangelogItem
                      version={data.version()}
                      date={data.date()}
                      latest={index() === 0}
                    >
                      <data.Component components={mdxComponents} />
                    </ChangelogItem>
                  </Suspense>
                );
              }}
            </For>
          </div>
        </SuspenseList>
      </DialogPanelContent>
      <Show when={props.paginated}>
        <DialogPanelFooter>
          <Box display={'flex'} justifyContent={'spaceBetween'}>
            <div>
              <Show when={previous()}>
                {previous => (
                  <Button
                    theme={'secondary'}
                    onClick={() => setCurrentIndex(index => index - 1)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-move-left"
                    >
                      <path d="M6 8L2 12L6 16" />
                      <path d="M2 12H22" />
                    </svg>
                    v{previous().version()}
                  </Button>
                )}
              </Show>
            </div>
            <div>
              <Show when={next()}>
                {next => (
                  <Button
                    theme={'secondary'}
                    onClick={() => setCurrentIndex(index => index + 1)}
                  >
                    v{next().version()}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      class="lucide lucide-move-right"
                    >
                      <path d="M18 8L22 12L18 16" />
                      <path d="M2 12H22" />
                    </svg>
                  </Button>
                )}
              </Show>
            </div>
          </Box>
        </DialogPanelFooter>
      </Show>
    </Dialog>
  );
}
