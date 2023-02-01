import * as styles from './CodeEditor.css';

interface CodeEditorPreviewBlockProps {
  code: string;
}

export function CodeEditorPreviewBlock(props: CodeEditorPreviewBlockProps) {
  return <pre class={styles.preview} innerText={props.code} />;
}
