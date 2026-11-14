import {useI18n} from '@codeimage/locale';
import {getFrameState} from '@codeimage/store/editor/frame';
import {toSignatureData} from '@codeimage/store/signatures/bridge';
import {getSignaturesStore} from '@codeimage/store/signatures/signatures';
import type {SavedSignature} from '@codeimage/store/signatures/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TextField,
} from '@codeui/kit';
import {createSignal, For, Match, Show, Switch} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import * as styles from './saved-signatures.css';

const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);

/**
 * The user's saved signatures, inline in the Signature section: pick one to
 * put a copy on the snippet, save the current one as new, and rename,
 * delete or make default the one the snippet came from.
 */
export function SavedSignaturesField(props: {id?: string}) {
  const [t] = useI18n<AppLocaleEntries>();
  const frame = getFrameState();
  const store = getSignaturesStore();
  // Naming happens in the row itself, in place of the trigger.
  const [naming, setNaming] = createSignal<
    {mode: 'new'} | {mode: 'rename'; signature: SavedSignature} | null
  >(null);
  const [name, setName] = createSignal('');
  let trigger: HTMLButtonElement | undefined;

  const current = () => frame.store.signature;
  const linked = () => store.byId(current()?.savedId);
  const edited = () => {
    const saved = linked();
    const signature = current();
    return (
      !!saved && !!signature && !same(saved.data, toSignatureData(signature))
    );
  };
  const full = () => store.limit();

  const startNaming = (
    next: {mode: 'new'} | {mode: 'rename'; signature: SavedSignature},
  ) => {
    setName(
      next.mode === 'rename'
        ? next.signature.name
        : t('savedSignatures.newName', {n: String(store.list().length + 1)}),
    );
    setNaming(next);
  };
  const finishNaming = (save: boolean) => {
    const value = name().trim().slice(0, 60);
    const state = naming();
    setNaming(null);
    queueMicrotask(() => trigger?.focus());
    if (!save || !value || !state) return;
    if (state.mode === 'new') void store.actions.saveAsNew({name: value});
    else void store.actions.rename({signature: state.signature, name: value});
  };

  return (
    <div class={styles.root}>
      <Show
        when={naming()}
        fallback={
          <DropdownMenu gutter={6} placement="bottom-end">
            <DropdownMenuTrigger
              ref={trigger}
              id={props.id}
              class={styles.trigger}
              aria-label={t('savedSignatures.menu')}
            >
              <span class={styles.triggerText}>
                <Show
                  when={linked()}
                  fallback={
                    <span class={styles.placeholder}>
                      {t('savedSignatures.notSaved')}
                    </span>
                  }
                >
                  {saved => (
                    <>
                      <span class={styles.name}>{saved().name}</span>
                      <Show when={edited()}>
                        <span class={styles.edited}>
                          · {t('savedSignatures.edited')}
                        </span>
                      </Show>
                    </>
                  )}
                </Show>
              </span>
              <svg
                class={styles.chevron}
                width="12"
                height="12"
                viewBox="0 0 12 12"
                aria-hidden="true"
              >
                <path
                  d="M3 4.5 6 7.5 9 4.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
              <DropdownMenuContent class={styles.menu}>
                <Show
                  when={store.list().length}
                  fallback={
                    <div class={styles.empty}>{t('savedSignatures.empty')}</div>
                  }
                >
                  <For each={store.list()}>
                    {saved => (
                      <DropdownMenuItem
                        class={styles.item}
                        data-current={
                          saved.id === current()?.savedId ? '' : undefined
                        }
                        onSelect={() => store.applyToFrame(saved)}
                      >
                        <span class={styles.check} aria-hidden="true">
                          <Show when={saved.id === current()?.savedId}>✓</Show>
                        </span>
                        <span class={styles.itemText}>
                          <span class={styles.name}>{saved.name}</span>
                          <span class={styles.meta}>{saved.data.handle}</span>
                        </span>
                        <Show when={saved.isDefault}>
                          <span
                            class={styles.badge}
                            title={t('savedSignatures.defaultHint')}
                          >
                            {t('savedSignatures.default')}
                          </span>
                        </Show>
                      </DropdownMenuItem>
                    )}
                  </For>
                </Show>
                <DropdownMenuSeparator />
                <Show when={linked()}>
                  {saved => (
                    <>
                      <Show when={edited()}>
                        <DropdownMenuItem
                          class={styles.item}
                          onSelect={() =>
                            void store.actions.updateWithCurrent(saved())
                          }
                        >
                          {t('savedSignatures.update', {name: saved().name})}
                        </DropdownMenuItem>
                      </Show>
                      <DropdownMenuItem
                        class={styles.item}
                        onSelect={() =>
                          startNaming({mode: 'rename', signature: saved()})
                        }
                      >
                        {t('savedSignatures.rename')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class={styles.item}
                        onSelect={() =>
                          void store.actions.toggleDefault(saved())
                        }
                      >
                        <Switch>
                          <Match when={saved().isDefault}>
                            {t('savedSignatures.unsetDefault')}
                          </Match>
                          <Match when={!saved().isDefault}>
                            {t('savedSignatures.setDefault')}
                          </Match>
                        </Switch>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        class={`${styles.item} ${styles.danger}`}
                        onSelect={() => void store.actions.remove(saved())}
                      >
                        {t('savedSignatures.delete')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                </Show>
                <DropdownMenuItem
                  class={styles.item}
                  disabled={full() || !current()}
                  onSelect={() => startNaming({mode: 'new'})}
                >
                  {t('savedSignatures.saveAsNew')}
                </DropdownMenuItem>
                <Show when={full()}>
                  <div class={styles.limit} role="note">
                    {t('savedSignatures.limit')}
                  </div>
                </Show>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        }
      >
        <form
          class={styles.naming}
          onSubmit={event => {
            event.preventDefault();
            finishNaming(true);
          }}
          onKeyDown={event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            finishNaming(false);
          }}
        >
          <TextField
            size="sm"
            aria-label={t('savedSignatures.nameLabel')}
            value={name()}
            onChange={setName}
            ref={(element: HTMLInputElement) =>
              queueMicrotask(() => {
                element.focus();
                element.select();
              })
            }
            slotClasses={{root: styles.namingField}}
          />
          <button
            type="submit"
            class={styles.confirm}
            disabled={!name().trim()}
          >
            {t('savedSignatures.save')}
          </button>
          <button
            type="button"
            class={styles.cancel}
            aria-label={t('savedSignatures.cancel')}
            title={t('savedSignatures.cancel')}
            onClick={() => finishNaming(false)}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path
                d="M2 2l6 6M8 2 2 8"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </form>
      </Show>
    </div>
  );
}
