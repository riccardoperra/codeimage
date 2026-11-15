import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {getAuth0State} from '@codeimage/store/auth/auth0';
import {getEditorSyncAdapter} from '@codeimage/store/editor/createEditorSync';
import {Button, buttonStyles, IconButton, Link} from '@codeui/kit';
import {useModality} from '@core/hooks/isMobile';
import {A as LocalLink} from '@solidjs/router';
import {createEffect, createSignal, onCleanup, Show, untrack} from 'solid-js';
import {CodeImageLogoV2} from '../../../components/Icons/CodeImageLogoV2';
import {CollectionIcon} from '../../../components/Icons/Collection';
import {ShareButton} from '../../../components/Toolbar/ShareButton';
import {ToolbarSnippetName} from '../../../components/Toolbar/ToolbarSnippetName';
import {CommandMenuButton} from '../command-menu/CommandMenuButton';
import {commandMenu} from '../command-menu/state';
import {UserBadge} from '../localized/UserBadge';
import type {Stage} from '../stage';
import * as styles from './header.css';
import {SparkleIcon} from '../../../components/WhatsNew/SparkleIcon';
import {
  curve,
  duration,
  fromKeyboard,
  reduceMotion,
} from '../../../components/WhatsNew/motion';
import * as newsStyles from '../../../components/WhatsNew/whats-new.css';
import {getWhatsNew} from '../../../state/whats-new';
import {ExperimentsIcon, SearchIcon, SettingsIcon} from './icons';
import {settings} from './settings-state';
import {headerHosts} from './header-actions';

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
  const adapter = getEditorSyncAdapter()!;
  const isRemote = () => !!adapter.snippetId();

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
        <WhatsNewButton />
        {/* Dock and Studio host their command triggers. */}
        <Show when={headerHosts('commands') && !props.stage.compact()}>
          <CommandMenuButton>
            {trigger => (
              <Button
                {...trigger}
                class={styles.search}
                size={'sm'}
                theme={'secondary'}
                variant={'ghost'}
                leftIcon={<SearchIcon size={16} />}
              >
                {t('editor.commands')}
                <kbd class={styles.kbd}>{commandMenu.shortcut}</kbd>
              </Button>
            )}
          </CommandMenuButton>
        </Show>
        <Show when={headerHosts('experiments')}>
          <IconButton
            class={styles.extraButton}
            size="sm"
            theme="secondary"
            variant="ghost"
            aria-label={t('editor.experiments')}
            title={t('editor.experiments')}
            aria-haspopup="dialog"
            data-experiments-trigger
            onClick={() => settings.open('experiments')}
          >
            <ExperimentsIcon />
          </IconButton>
        </Show>
        {/* Studio and Dock have a better home for it on a wide window. */}
        <Show when={headerHosts('settings')}>
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
          <ShareButton
            showLabel={false}
            url={isRemote() ? window.location.href : undefined}
          />
          <props.stage.ExportButton />
        </Show>
        <Show when={props.stage.compact() && isRemote()}>
          <ShareButton showLabel={false} url={window.location.href} />
        </Show>
        <UserBadge />
      </div>
    </header>
  );
}

/** First in a right-aligned row: its width never moves the other actions. */
function WhatsNewButton() {
  const [t] = useI18n<AppLocaleEntries>();
  const news = getWhatsNew();
  const [present, setPresent] = createSignal(false);
  let button: HTMLButtonElement | undefined;

  createEffect(() => {
    const visible = news.headerEntry();
    const pointer = untrack(news.interaction) === 'pointer';
    let animation: Animation | undefined;
    let cancelled = false;
    if (visible) setPresent(true);
    if (!pointer) setPresent(visible);
    else {
      // Let Show mount its button before starting the compositor animation.
      queueMicrotask(() => {
        if (cancelled || !button) return;
        const reduced = matchMedia(reduceMotion).matches;
        const hidden = reduced
          ? {opacity: 0}
          : {opacity: 0, transform: 'scale(.96)'};
        const shown = reduced
          ? {opacity: 1}
          : {opacity: 1, transform: 'scale(1)'};
        animation = button.animate(
          visible ? [hidden, shown] : [shown, hidden],
          {
            duration: visible ? duration.coachmarkIn : duration.coachmarkOut,
            easing: curve.out,
            fill: 'both',
          },
        );
        animation.onfinish = () => {
          if (!visible) setPresent(false);
          animation?.cancel();
        };
      });
    }
    onCleanup(() => {
      cancelled = true;
      animation?.cancel();
    });
  });

  return (
    <Show when={present()}>
      <Button
        ref={button}
        class={styles.extraButton}
        size="sm"
        theme="secondary"
        variant="ghost"
        aria-controls="whats-new-nudge"
        inert={!news.headerEntry() || undefined}
        data-whats-new-trigger
        onClick={(event: MouseEvent) => news.reopen(fromKeyboard(event))}
      >
        <span class={styles.newsIcon}>
          <SparkleIcon />
          <Show when={news.headerUnread()}>
            <span
              class={styles.headerDot}
              aria-hidden="true"
              data-whats-new-unread
            >
              <span class={newsStyles.unreadDot} />
            </span>
          </Show>
        </span>
        {t('editor.whatsNew')}
      </Button>
    </Show>
  );
}
