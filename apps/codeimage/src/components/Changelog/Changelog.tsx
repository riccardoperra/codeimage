import {Dialog, DialogPanelContent} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {Component, For, Suspense, SuspenseList} from 'solid-js';
import {mdxComponents} from '../../mdx/components';
import * as styles from './Changelog.css';
import {ChangelogItem} from './ChangelogItem';
import {resolveChangelog} from './resolveChangelog';

const ChangelogFiles = import.meta.glob('../../../changelog/*.mdx');

type ChangelogProp = ControlledDialogProps & {
  latest?: boolean;
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
  const entries = () => {
    if (props.latest) {
      return [changelogFileEntries[0]];
    }
    return changelogFileEntries;
  };

  return (
    <Dialog
      title={"What's new"}
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
    </Dialog>
  );
}
