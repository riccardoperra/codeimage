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
import type {JSX} from 'solid-js';
import {createSignal, For, Match, Show, Switch} from 'solid-js';
import type {AppLocaleEntries} from '../../../i18n';
import * as styles from './saved-signatures.css';

/** Applies and manages the user's saved signatures. */
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
      !!saved &&
      !!signature &&
      JSON.stringify(saved.data) !== JSON.stringify(toSignatureData(signature))
    );
  };

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
  const cancelNaming = () => finishNaming(false);
  const saveAsNew = () => startNaming({mode: 'new'});
  const submitName: JSX.EventHandler<HTMLFormElement, SubmitEvent> = event => {
    event.preventDefault();
    finishNaming(true);
  };
  const onKeyDown: JSX.EventHandler<HTMLFormElement, KeyboardEvent> = event => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    cancelNaming();
  };
  const focusName = (element: HTMLInputElement) => {
    queueMicrotask(() => {
      element.focus();
      element.select();
    });
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
                    {saved => {
                      const applySignature = () => store.applyToFrame(saved);
                      return (
                        <DropdownMenuItem
                          class={styles.item}
                          data-current={
                            saved.id === current()?.savedId ? '' : undefined
                          }
                          onSelect={applySignature}
                        >
                          <span class={styles.check} aria-hidden="true">
                            <Show when={saved.id === current()?.savedId}>
                              ✓
                            </Show>
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
                      );
                    }}
                  </For>
                </Show>
                <DropdownMenuSeparator />
                <Show when={linked()}>
                  {saved => {
                    const updateSignature = () =>
                      void store.actions.updateWithCurrent(saved());
                    const renameSignature = () =>
                      startNaming({mode: 'rename', signature: saved()});
                    const toggleDefault = () =>
                      void store.actions.toggleDefault(saved());
                    const removeSignature = () =>
                      void store.actions.remove(saved());
                    return (
                      <>
                        <Show when={edited()}>
                          <DropdownMenuItem
                            class={styles.item}
                            onSelect={updateSignature}
                          >
                            {t('savedSignatures.update', {name: saved().name})}
                          </DropdownMenuItem>
                        </Show>
                        <DropdownMenuItem
                          class={styles.item}
                          onSelect={renameSignature}
                        >
                          {t('savedSignatures.rename')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          class={styles.item}
                          onSelect={toggleDefault}
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
                          onSelect={removeSignature}
                        >
                          {t('savedSignatures.delete')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    );
                  }}
                </Show>
                <DropdownMenuItem
                  class={styles.item}
                  disabled={store.limit() || !current()}
                  onSelect={saveAsNew}
                >
                  {t('savedSignatures.saveAsNew')}
                </DropdownMenuItem>
                <Show when={store.limit()}>
                  <div class={styles.limit} role="note">
                    {t('savedSignatures.limit')}
                  </div>
                </Show>
              </DropdownMenuContent>
            </DropdownMenuPortal>
          </DropdownMenu>
        }
      >
        <form class={styles.naming} onSubmit={submitName} onKeyDown={onKeyDown}>
          <TextField
            size="sm"
            aria-label={t('savedSignatures.nameLabel')}
            value={name()}
            onChange={setName}
            ref={focusName}
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
            onClick={cancelNaming}
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
