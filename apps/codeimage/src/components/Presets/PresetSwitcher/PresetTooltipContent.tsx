import {useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {Box, Link} from '@codeimage/ui';
import {type AppLocaleEntries} from '../../../i18n';

export function PresetTooltipContent() {
  const {loggedIn, login} = getAuth0State();
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
              onClick={login}
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
