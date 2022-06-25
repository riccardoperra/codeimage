import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../../i18n';

export const windowsShadows = {
  none: 'none',
  bottom: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px',
  sm: 'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
  md: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
  xl: 'rgba(0, 0, 0, 0.56) 0px 22px 70px 4px',
  '3d': 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
};
export const shadowsLabel = () => {
  const [t] = useI18n<AppLocaleEntries>();
  return [
    {
      label: t('shadows.none'),
      value: windowsShadows.none,
    },
    {
      label: t('shadows.bottom'),
      value: windowsShadows.bottom,
    },
    {
      label: t('shadows.sm'),
      value: windowsShadows.sm,
    },
    {
      label: t('shadows.md'),
      value: windowsShadows.md,
    },
    {
      label: t('shadows.xl'),
      value: windowsShadows.xl,
    },
    {
      label: t('shadows.3d'),
      value: windowsShadows['3d'],
    },
  ];
};
