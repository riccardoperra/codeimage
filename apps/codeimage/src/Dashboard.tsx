import {Text} from '@codeimage/ui';
import {Link} from 'solid-app-router';
import {createEffect, createResource, For, Show} from 'solid-js';
import {Footer} from './components/Footer/Footer';
import {CodeIcon} from './components/Icons/Code';
import {FolderIcon} from './components/Icons/Folder';
import * as styles from './Dashboard.css';

export type WorkspaceItemType = 'folder' | 'project';

export interface WorkspaceItem {
  id: string;
  type: WorkspaceItemType;
  name: string;
  createDate: string;
  lastUpdateDate: string;
}

export default function Dashboard() {
  const [data] = createResource<WorkspaceItem[]>(() =>
    fetch('/workspace')
      .then(res => res.json())
      .then((res: WorkspaceItem[]) =>
        res.sort(a => (a.type === 'folder' ? -1 : 1)),
      ),
  );

  createEffect(() => console.log(data()));

  return (
    <div class={styles.wrapper}>
      <div class={styles.main}>
        <h1 class={styles.title}>Workspace</h1>

        <ul class={styles.gridList}>
          <For each={data()}>
            {item => (
              <li class={styles.item}>
                <Link href={`/${item.id}`} class={styles.itemLink} />
                <div class={styles.itemTitle}>
                  <Show
                    fallback={<CodeIcon size={'lg'} />}
                    when={item.type === 'folder'}
                  >
                    <FolderIcon size={'lg'} />
                  </Show>
                  <Text size={'lg'}>{item.name}</Text>
                </div>
              </li>
            )}
          </For>
        </ul>
      </div>

      <Footer />
    </div>
  );
}
