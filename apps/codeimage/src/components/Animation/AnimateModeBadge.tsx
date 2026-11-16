import type {AppLocaleEntries} from '../../i18n';
import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import * as styles from './AnimationPreview.css';

export function AnimateModeBadge() {
  const [t] = useI18n<AppLocaleEntries>();
  const {animation, editor} = getEditorStore();
  const done = () => {
    animation.actions.setOpen(false);
    editor.activeEditorView()?.focus();
  };
  return (
    <div class={styles.mode} data-animate-mode>
      <span class={styles.modeDot} aria-hidden="true" />
      <span class={styles.modeLabel}>{t('animation.toolbar')}</span>
      <button
        type="button"
        class={styles.modeDone}
        onClick={done}
        aria-label={t('animation.timeline.leaveMode')}
        data-animate-done
      >
        {t('animation.timeline.done')}
        <kbd class={styles.modeKey}>Esc</kbd>
      </button>
    </div>
  );
}
