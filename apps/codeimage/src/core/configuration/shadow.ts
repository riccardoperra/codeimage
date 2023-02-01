import {useI18n} from '@codeimage/locale';
import {AppLocaleEntries} from '../../i18n';

export const TERMINAL_SHADOWS = {
  none: 'unset',
  bottom: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px',
  sm: 'rgba(0, 0, 0, 0.5) 0px 0px 5px 0px, rgba(0, 0, 0, 0.5) 0px 0px 1px 0px',
  md: 'rgb(0 0 0 / 40%) 0px 30px 55px',
  lg: 'rgba(0, 0, 0, 0.60) 0px 45px 70px 4px ',
  '3d': 'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
} as const;

export const shadowsLabel = () => {
  const [t] = useI18n<AppLocaleEntries>();
  return [
    {
      label: t('shadows.none'),
      value: TERMINAL_SHADOWS.none,
    },
    {
      label: t('shadows.sm'),
      value: TERMINAL_SHADOWS.sm,
    },
    {
      label: t('shadows.md'),
      value: TERMINAL_SHADOWS.md,
    },
    {
      label: t('shadows.lg'),
      value: TERMINAL_SHADOWS.lg,
    },
    {
      label: t('shadows.bottom'),
      value: TERMINAL_SHADOWS.bottom,
    },
    {
      label: t('shadows.3d'),
      value: TERMINAL_SHADOWS['3d'],
    },
  ];
};
