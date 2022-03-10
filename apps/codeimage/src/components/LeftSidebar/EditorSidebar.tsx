import EditorForm from './EditorForm';
import WindowStyleForm from './WindowStyleForm';
import FrameStyleForm from './FrameStyleForm';
import EditorStyleForm from './EditorStyleForm';
import {JSXElement} from 'solid-js';

export default function EditorSidebar(): JSXElement {
  return (
    <EditorForm>
      <FrameStyleForm />

      <WindowStyleForm />

      <EditorStyleForm />
    </EditorForm>
  );
}
