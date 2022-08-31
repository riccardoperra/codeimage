import {EditorSyncProvider} from '@codeimage/store/editor/createEditorInit';
import {useParams} from '@solidjs/router';
import {lazy} from 'solid-js';

const App = lazy(() => import('./App'));

export default function Editor() {
  const params = useParams();
  return (
    <EditorSyncProvider snippetId={params.snippetId}>
      <App />
    </EditorSyncProvider>
  );
}
