import styles from '../App.module.css';
import {createEffect} from 'solid-js';
import {EditorView} from '@codemirror/view';
import {EditorState} from '@codemirror/state';
import {basicSetup} from '@codemirror/basic-setup';
import {javascript} from '@codemirror/lang-javascript';

export const CodeMirror = () => {
	let codeMirrorRef!: HTMLDivElement;

	createEffect(() => {
		const theme = EditorView.theme({
			'&': {
				fontFamily: 'Source Code Pro, monospace',
			},
			'.cm-content': {
				fontFamily: 'Source Code Pro, monospace',
				textAlign: 'left',
			},
			'.cm-gutters': {
				display: 'none',
			},
		});
		const editor = new EditorView({
			parent: codeMirrorRef,
			state: EditorState.create({
				extensions: [
					basicSetup,
					javascript({typescript: true, jsx: true}),
					theme,
				],
			}),
		});

		return () => editor.destroy();
	});

	return <div class={styles.Editor} ref={codeMirrorRef} />;
};
