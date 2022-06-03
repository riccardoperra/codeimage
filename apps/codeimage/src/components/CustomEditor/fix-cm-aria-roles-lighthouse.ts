import {onMount} from 'solid-js';

export function fixCodeMirrorAriaRole() {
  onMount(() => {
    const content = document.querySelector('.cm-content');
    if (!content) {
      console.warn(
        '[DEV] No CodeMirror element found with .cm-content className',
      );
      return;
    }

    /**
     * **🚀 Seo tip: fix invalid aria roles for CodeMirror**
     */
    content.setAttribute('id', 'codeEditor');
    content.setAttribute('aria-label', 'codeimage-editor');
    content.removeAttribute('aria-expanded');
  });
}
