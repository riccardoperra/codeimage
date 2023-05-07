import {EditorSyncProvider} from '@codeimage/store/editor/createEditorSync';
import {useParams, useSearchParams} from '@solidjs/router';
import {createMemo, lazy} from 'solid-js';

const App = lazy(() => import('./App'));

export default function Editor() {
  const params = useParams();
  const [queryParams] = useSearchParams();

  const data = createMemo(() => {
    try {
      return JSON.parse(queryParams.state);
    } catch (e) {
      return null;
    }
  });

  return (
    <EditorSyncProvider snippetId={params.snippetId} initialState={data()}>
      <App />
    </EditorSyncProvider>
  );
}
