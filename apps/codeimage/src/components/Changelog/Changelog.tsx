import {Dialog, DialogPanelContent} from '@codeui/kit';
import {ControlledDialogProps} from '@core/hooks/createControlledDialog';
import {Component, For, lazy, Suspense, SuspenseList} from 'solid-js';
import {ChangelogItem} from './ChangelogItem';
import * as styles from './Changelog.css';

const ChangelogFiles = import.meta.glob('../../../changelog/*.mdx');

type ChangelogProp = ControlledDialogProps;

export function Changelog(props: ChangelogProp) {
  return (
    <Dialog
      title={"What's new"}
      open={props.isOpen}
      size={'xl'}
      onOpenChange={props.onOpenChange}
    >
      <DialogPanelContent>
        <SuspenseList revealOrder={'forwards'}>
          <div class={styles.changelogList}>
            <For each={Object.entries(ChangelogFiles)}>
              {([path, file]) => {
                const fileFn = file as () => Promise<{default: Component}>;
                const File = lazy(fileFn);

                const [parsedVersion, parsedDate] = path
                  .split('/')
                  .at(-1)!
                  .replace('.mdx', '')
                  .split('_');

                const version = parsedVersion.replaceAll('-', '.');

                const [month, day, year] = parsedDate
                  .split('-')
                  .map(str => parseInt(str, 10));

                const date = new Date(year, month, day);
                return (
                  <Suspense>
                    <ChangelogItem version={version} date={date}>
                      <File />
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
