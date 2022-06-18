import {useI18n} from '@codeimage/locale';
import {themeVars} from '@codeimage/ui';
import {AppLocaleEntries} from '../../../i18n';

export const shadowsLabel = () => {
  const [t] = useI18n<AppLocaleEntries>();
  return [
    {
      label: t('shadows.none'),
      value: 'none',
    },
    {
      label: t('shadows.bottom'),
      value: 'rgba(0, 0, 0, 0.45) 0px 25px 20px -20px',
    },
    {
      label: t('shadows.sm'),
      value:
        'rgba(60, 64, 67, 0.3) 0px 1px 2px 0px, rgba(60, 64, 67, 0.15) 0px 1px 3px 1px',
    },
    {
      label: t('shadows.md'),
      value: 'rgba(0, 0, 0, 0.16) 0px 3px 6px, rgba(0, 0, 0, 0.23) 0px 3px 6px',
    },
    {
      label: t('shadows.lg'),
      value: themeVars.boxShadow.lg,
    },
    {
      label: t('shadows.xl'),
      value: 'rgba(0, 0, 0, 0.56) 0px 22px 70px 4px',
    },
    {
      label: t('shadows.3d'),
      value:
        'rgba(0, 0, 0, 0.4) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px, rgba(0, 0, 0, 0.2) 0px -3px 0px inset',
    },
    {
      label: t('shadows.outlined'),
      value: 'rgba(3, 102, 214, 0.3) 0px 0px 0px 3px',
    },
  ];
};
