import {Accessor, createEffect, on} from 'solid-js';

export function fixCodeMirrorAriaRole(elAccessor: Accessor<HTMLElement>) {
  createEffect(
    on(elAccessor, el => {
      requestAnimationFrame(() => {
        const content = el.querySelector('.cm-content');
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
    }),
  );
}
