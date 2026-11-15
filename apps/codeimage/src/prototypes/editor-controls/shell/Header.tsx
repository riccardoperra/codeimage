import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {buttonStyles, IconButton, Link} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import {A as LocalLink} from '@solidjs/router';
import {Show} from 'solid-js';
import {CodeImageLogoV2} from '../../../components/Icons/CodeImageLogoV2';
import {CollectionIcon} from '../../../components/Icons/Collection';
import {ShareButton} from '../../../components/Toolbar/ShareButton';
import {ToolbarSnippetName} from '../../../components/Toolbar/ToolbarSnippetName';
import {UserBadge} from '../localized/UserBadge';
import type {Stage} from '../stage';
import * as styles from './header.css';
import {SettingsIcon} from './icons';
import {settings} from './settings-state';

/**
 * The page header of the unified editor, in place of today's `Toolbar`. It
 * keeps the logo, the snippet name, Export and sign-in, all production
 * components, and swaps the menu at the top left for one Settings button.
 * The menu's other entries live in the settings dialog and the command menu.
 */
export function Header(props: {stage: Stage}) {
  const [t] = useI18n<AppLocaleEntries>();
  // The production buttons pick their size once, at load, from this.
  const modality = useModality();
  const loggedIn = () => getAuth0State().loggedIn();
  const isRemote = () => !!getEditorSyncAdapter()?.snippetId();

  return (
    <header class={styles.header}>
      <div class={styles.brand}>
        {/*
          28px in a row of 36px buttons: at 22px the mark left 7px of air
          above and below it and the left side read lighter than the right.
        */}
        <CodeImageLogoV2 height={28} withGradient={true} />
      </div>
      <Show when={loggedIn() && modality === 'full'}>
        <Link
          as={LocalLink}
          href={'/dashboard'}
          class={buttonStyles.button({
            theme: 'secondary',
            variant: 'ghost',
            size: 'sm',
          })}
        >
          <CollectionIcon />
          {t('editor.dashboard')}
        </Link>
      </Show>

      <Show when={modality === 'full' && isRemote()}>
        <div class={styles.title}>
          <ToolbarSnippetName />
        </div>
      </Show>

      <div class={styles.actions}>
        {/* Studio and Dock have a better home for it on a wide window. */}
        <Show when={!settings.inLayout()}>
          <IconButton
            size={'sm'}
            theme={'secondary'}
            variant={'ghost'}
            aria-label={t('editor.settings')}
            title={t('editor.settings')}
            aria-haspopup="dialog"
            data-settings-trigger
            onClick={() => settings.open()}
          >
            <SettingsIcon />
          </IconButton>
        </Show>
        {/* As today, a phone gets Export from the layout, beside the canvas. */}
        <Show when={!props.stage.compact()}>
          <ShareButton showLabel={false} />
          <props.stage.ExportButton />
        </Show>
        <UserBadge />
      </div>
    </header>
  );
}
