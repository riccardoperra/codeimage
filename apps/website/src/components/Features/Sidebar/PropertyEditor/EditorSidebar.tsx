import {EditorForm} from './EditorForm';
import {FrameStyleForm} from './FrameStyleForm';
import {PanelDivider} from './PanelDivider';

export const EditorSidebar = () => {
  return (
    <EditorForm>
      <div>
        <FrameStyleForm />
      </div>
      <PanelDivider />
      {/*<div>*/}
      {/*  <WindowStyleForm />*/}
      {/*</div>*/}
      {/*<PanelDivider />*/}
      {/*<div>*/}
      {/*  <EditorStyleForm />*/}
      {/*</div>*/}
    </EditorForm>
  );
};
