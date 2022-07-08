import {createEffect, createResource, For} from 'solid-js';
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
    fetch('/workspace').then(res => res.json()),
  );

  createEffect(() => console.log(data()));

  return (
    <div class={styles.wrapper}>
      <h1 class={styles.title}>Workspace</h1>

      <div class={styles.gridList}>
        <For each={data()}>
          {item => <div class={styles.item}>{item.name}</div>}
        </For>
      </div>
    </div>
  );
}
