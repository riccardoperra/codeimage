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
import {UserBadge} from '../../../components/UserBadge/UserBadge';
import type {Stage} from '../stage';
import * as styles from './header.css';
import {settings} from './settings-state';

function SettingsIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  );
}

/**
 * The page header of the unified editor, in place of today's `Toolbar`. It
 * keeps the logo, the snippet name, Export and sign-in, all production
 * components, and swaps the menu at the top left for one Settings button.
 * The menu's other entries live in the settings dialog and the command menu.
 */
export function Header(props: {stage: Stage}) {
  // The production buttons pick their size once, at load, from this.
  const modality = useModality();
  const loggedIn = () => getAuth0State().loggedIn();
  const isRemote = () => !!getEditorSyncAdapter()?.snippetId();

  return (
    <header class={styles.header}>
      <div class={styles.brand}>
        <CodeImageLogoV2 height={22} withGradient={true} />
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
          Dashboard
        </Link>
      </Show>

      <Show when={modality === 'full' && isRemote()}>
        <div class={styles.title}>
          <ToolbarSnippetName />
        </div>
      </Show>

      <div class={styles.actions}>
        <IconButton
          size={'sm'}
          theme={'secondary'}
          variant={'ghost'}
          aria-label={'Settings'}
          title={'Settings'}
          aria-haspopup="dialog"
          data-settings-trigger
          onClick={settings.open}
        >
          <SettingsIcon />
        </IconButton>
        {/* As today, a phone gets Export from the layout, beside the canvas. */}
        <Show when={modality === 'full'}>
          <ShareButton showLabel={false} />
          <props.stage.ExportButton />
        </Show>
        <UserBadge />
      </div>
    </header>
  );
}
