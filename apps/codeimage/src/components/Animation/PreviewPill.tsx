import {useI18n} from '@codeimage/locale';
import {getEditorStore} from '@codeimage/store/editor';
import type {AppLocaleEntries} from '../../i18n';
import * as styles from './AnimationPreview.css';

export function PreviewPill() {
  const {animation} = getEditorStore();
  const [t] = useI18n<AppLocaleEntries>();
  const edit = () => animation.actions.editStep(animation.currentStep());
  return (
    <button type="button" class={styles.pill} data-preview-pill onClick={edit}>
      {t('animation.previewPill', {n: String(animation.currentStep() + 1)})}
    </button>
  );
}
