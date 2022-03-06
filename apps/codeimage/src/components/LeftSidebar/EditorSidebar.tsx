import {EditorForm} from './EditorForm';
import {WindowStyleForm} from './WindowStyleForm';
import {FrameStyleForm} from './FrameStyleForm';
import {EditorStyleForm} from './EditorStyleForm';

export const EditorSidebar = () => {
  return (
    <EditorForm>
      <FrameStyleForm />

      <WindowStyleForm />

      <EditorStyleForm />
    </EditorForm>
  );
};
