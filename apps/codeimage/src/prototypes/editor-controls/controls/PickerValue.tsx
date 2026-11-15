import {useI18n} from '@codeimage/locale';
import {getAssetsStore, isAssetUrl} from '@codeimage/store/assets/assets';
import {getFrameState} from '@codeimage/store/editor/frame';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import type {Control} from '../model';
import * as styles from './overlay.css';

export function PickerValue(props: {control: Control}) {
  const [t] = useI18n<AppLocaleEntries>();
  const frame = getFrameState();
  const assets = getAssetsStore();
  const image = () =>
    (props.control.id === 'frame.backgroundImage' ||
      props.control.kind === 'background') &&
    isAssetUrl(frame.store.background)
      ? assets.getAsset(frame.store.background)()
      : undefined;
  const swatch = () =>
    props.control.kind === 'background' && !isAssetUrl(props.control.value())
      ? props.control.value() || props.control.ambient().value
      : undefined;
  const value = () => {
    const control = props.control;
    if (control.kind === 'select' || control.kind === 'segmented')
      return control.options().find(option => option.key === control.value())
        ?.label;
    if (control.kind === 'background')
      return isAssetUrl(control.value())
        ? (image()?.name ?? t('editor.backgroundImage'))
        : control.value() || control.ambient().label;
    return image()?.name ?? t('editor.noImage');
  };
  return (
    <span class={styles.value}>
      <Show when={image()}>
        {asset => <img class={styles.swatch} src={asset().url} alt="" />}
      </Show>
      <Show when={swatch()}>
        {fill => <span class={styles.swatch} style={{background: fill()}} />}
      </Show>
      <span class={styles.valueText}>{value()}</span>
    </span>
  );
}
