import {useI18n} from '@codeimage/locale';
import {IconButton} from '@codeimage/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@ui/DropdownMenu';
import {Show} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MinusSquareIcon,
  TabPlusIcon,
  TrashIcon,
} from '../icons';
import {
  menuAnchor,
  menuOpen,
  setMenuAnchor,
  setMenuOpen,
  timelineActions,
} from './actions';
import {createTimelineInputRef} from './input';
import type {TimelineModel, TimelineStep} from './model';
import * as styles from './toolbar.css';

export function StepMenu(props: {step: TimelineStep; model: TimelineModel}) {
  const [t] = useI18n<AppLocaleEntries>();
  const inputRef = createTimelineInputRef();
  const actions = timelineActions();
  const tab = () => props.model.tabOf(props.step.editorId);
  const tabIndex = () => props.step.tab - 1;
  let focusLast = false;
  const change = (open: boolean) => {
    if (!open) setMenuAnchor(null);
    setMenuOpen(open);
  };
  const anchorRect = () => {
    const point = menuAnchor();
    if (point) return () => new DOMRect(point.x, point.y);
  };
  const autofocus = (event: Event) => {
    if (!focusLast || !(event.currentTarget instanceof HTMLElement)) return;
    const last = [
      ...event.currentTarget.querySelectorAll<HTMLElement>(
        '[role=menuitem]:enabled',
      ),
    ].at(-1);
    if (!last) return;
    event.preventDefault();
    last.focus({preventScroll: true});
  };
  return (
    <DropdownMenu
      open={menuOpen()}
      onOpenChange={change}
      placement="top-end"
      getAnchorRect={anchorRect()}
      exitDuration={120}
    >
      <DropdownMenuTrigger
        as={IconButton}
        class={styles.button}
        size="xs"
        theme="secondary"
        variant="link"
        aria-label={t('animation.timeline.more')}
        data-step-menu
        onClick={() => {
          focusLast = false;
        }}
        onKeyDown={event => {
          focusLast = event.key === 'ArrowUp';
        }}
      >
        •••
      </DropdownMenuTrigger>
      <DropdownMenuPortal>
        <DropdownMenuContent
          class={styles.menu}
          ref={inputRef}
          data-animation-steps-menu
          aria-label={t('animation.timeline.more')}
          onOpenAutoFocus={autofocus}
        >
          <Show when={props.step.source.kind === 'script'}>
            <div class={styles.menuLabel} aria-hidden="true">
              {t('animation.timeline.stepNumber', {
                n: String(props.step.sub),
              })}
            </div>
            <DropdownMenuItem
              data-script-remove
              class={`${styles.menuItem} ${styles.danger}`}
              data-menu-danger
              onSelect={() => actions.removeStep(props.step)}
            >
              <MinusSquareIcon class={styles.menuIcon} />
              {t('animation.remove')}
            </DropdownMenuItem>
            <hr role="separator" class={styles.menuSeparator} />
          </Show>
          <div class={styles.menuLabel} aria-hidden="true">
            {t('animation.timeline.tabNumber', {n: String(props.step.tab)})} ·{' '}
            {tab()?.name}
          </div>
          <DropdownMenuItem
            class={styles.menuItem}
            disabled={tabIndex() <= 0}
            onSelect={() =>
              actions.moveTab(props.step.editorId, tabIndex() - 1)
            }
          >
            <ArrowLeftIcon class={styles.menuIcon} />
            {t('animation.moveEarlier')}
          </DropdownMenuItem>
          <DropdownMenuItem
            class={styles.menuItem}
            disabled={tabIndex() >= actions.tabCount() - 1}
            onSelect={() =>
              actions.moveTab(props.step.editorId, tabIndex() + 1)
            }
          >
            <ArrowRightIcon class={styles.menuIcon} />
            {t('animation.moveLater')}
          </DropdownMenuItem>
          <DropdownMenuItem
            class={styles.menuItem}
            disabled={!actions.canAddTab()}
            onSelect={actions.addTab}
          >
            <TabPlusIcon class={styles.menuIcon} />
            {t('animation.timeline.addTabAtEnd')}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!actions.canRemoveTab()}
            data-close-tab
            class={`${styles.menuItem} ${styles.danger}`}
            data-menu-danger
            onSelect={() => actions.removeTab(props.step.editorId)}
          >
            <TrashIcon class={styles.menuIcon} />
            {t('animation.timeline.removeTab')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </DropdownMenu>
  );
}
