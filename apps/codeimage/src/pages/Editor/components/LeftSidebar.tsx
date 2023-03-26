import {EditorForm} from '../../../components/PropertyEditor/EditorForm';
import {EditorSidebar} from '../../../components/PropertyEditor/EditorSidebar';
import {Sidebar} from '../../../components/Scaffold/Sidebar/Sidebar';

export function EditorLeftSidebar() {
  return (
    <>
      <Sidebar>
        <EditorForm>
          <EditorSidebar />
        </EditorForm>
      </Sidebar>
    </>
  );
}
