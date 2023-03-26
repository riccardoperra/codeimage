import {EditorStyleForm} from './EditorStyleForm';
import {FrameStyleForm} from './FrameStyleForm';
import {PanelDivider} from './PanelDivider';
import {WindowStyleForm} from './WindowStyleForm';

export const EditorSidebar = () => {
  return (
    <>
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
    </>
  );
};
