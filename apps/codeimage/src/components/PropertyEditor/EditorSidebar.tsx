import {EditorForm} from './EditorForm';
import {WindowStyleForm} from './WindowStyleForm';
import {FrameStyleForm} from './FrameStyleForm';
import {EditorStyleForm} from './EditorStyleForm';
import * as styles from '../Scaffold/Sidebar/Sidebar.css';
import {CodeImageLogo} from '../Icons/CodeImageLogo';

export const EditorSidebar = () => {
  return (
    <EditorForm>
      <div class={styles.sidebarLogo}>
        <CodeImageLogo width={'70%'} />
      </div>
      <FrameStyleForm />

      <WindowStyleForm />

      <EditorStyleForm />
    </EditorForm>
  );
};
