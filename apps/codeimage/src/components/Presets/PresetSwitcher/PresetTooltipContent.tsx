import {useI18n} from '@codeimage/locale';
import {AuthState} from '@codeimage/store/auth/auth';
import {provideAppState} from '@codeimage/store/index';
import {Box, Link} from '@codeimage/ui';
import {AppLocaleEntries} from '../../../i18n';

export function PresetTooltipContent() {
  const {loggedIn, openLoginPopup} = provideAppState(AuthState);
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <>
      {loggedIn() ? (
        <span>{t('presets.limit.user.label')}</span>
      ) : (
        <Box>
          <p>{t('presets.limit.guest.label')}</p>
          <p>
            <Link
              as="button"
              onClick={openLoginPopup}
              size={'sm'}
              underline
              weight={'medium'}
              style={{cursor: 'pointer'}}
            >
              Log in
            </Link>{' '}
            {t('presets.limit.guest.actionLabel')}
          </p>
        </Box>
      )}
    </>
  );
}
