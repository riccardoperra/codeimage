import styles from './CodeEditor.module.css';

interface CodeEditorPreviewBlockProps {
  code: string;
}

export function CodeEditorPreviewBlock(props: CodeEditorPreviewBlockProps) {
  return <pre class={styles.preview} innerText={props.code} />;
}
