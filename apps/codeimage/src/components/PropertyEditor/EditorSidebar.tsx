import {EditorForm} from './EditorForm';
import {EditorStyleForm} from './EditorStyleForm';
import {FrameStyleForm} from './FrameStyleForm';
import {PanelDivider} from './PanelDivider';
import {WindowStyleForm} from './WindowStyleForm';

export const EditorSidebar = () => {
  return (
    <EditorForm>
      <div>
        <FrameStyleForm />
      </div>
      <PanelDivider />

      <div>
        <WindowStyleForm />
      </div>
      <PanelDivider />

      <div>
        <EditorStyleForm />
      </div>
    </EditorForm>
  );
};
