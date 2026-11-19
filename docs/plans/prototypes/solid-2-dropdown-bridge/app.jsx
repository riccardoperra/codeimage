import {DropdownMenu as KobalteMenu} from '@kobalte/core/dropdown-menu';
import {Button} from '@codeui/kit';
import {render} from '@solidjs/web';
import {createMemo, createSignal, Show} from 'solid-js';
import {ProjectActionsMenu} from '../../../../apps/codeimage/src/pages/Dashboard/components/ProjectItem/ProjectActionsMenu';

const labels = {
  it: ['Rinomina', 'Duplica', 'Elimina'],
  en: ['Rename', 'Duplicate', 'Delete'],
};
function App() {
  const [mounted, setMounted] = createSignal(true);
  const [disabled, setDisabled] = createSignal(false);
  const [locale, setLocale] = createSignal('it');
  const [events, setEvents] = createSignal(0);
  const [lastAction, setLastAction] = createSignal('—');

  function selectAction(id) {
    setLastAction(id);
    setEvents(count => count + 1);
  }

  const directLabel = createMemo(() =>
    locale() === 'it' ? 'Opzione Kobalte' : 'Kobalte option',
  );

  return (
    <main>
      <section aria-labelledby="controls" class="demo">
        <div class="host">
          <h2 id="controls">Host Solid 2</h2>
          <div class="controls">
            <button
              onClick={() => setLocale(value => (value === 'it' ? 'en' : 'it'))}
            >
              {locale() === 'it' ? 'Passa a EN' : 'Passa a IT'}
            </button>
            <button onClick={() => setMounted(value => !value)}>
              {mounted() ? 'Smonta componenti' : 'Rimonta componenti'}
            </button>
            <button onClick={() => setDisabled(value => !value)}>
              {disabled() ? 'Abilita Button' : 'Disabilita Button'}
            </button>
          </div>
          <dl aria-live="polite">
            <div>
              <dt>Ultima azione</dt>
              <dd id="last-action">{lastAction()}</dd>
            </div>
            <div>
              <dt>Eventi ricevuti</dt>
              <dd id="event-count">{events()}</dd>
            </div>
          </dl>
        </div>
        <div class="legacy">
          <Show when={mounted()} fallback={<p>Componenti smontati</p>}>
            <div class="menu-row">
              <h2>Button · CodeUI</h2>
              <Button
                type="button"
                theme="primary"
                size="md"
                disabled={disabled()}
                onClick={
                  locale() === 'it'
                    ? () => selectAction('save-it')
                    : () => selectAction('save-en')
                }
              >
                {locale() === 'it' ? 'Salva' : 'Save'}
              </Button>
            </div>
            <div class="menu-row">
              <h2>Azioni progetto · CodeUI</h2>
              <ProjectActionsMenu
                renameLabel={labels[locale()][0]}
                duplicateLabel={labels[locale()][1]}
                deleteLabel={labels[locale()][2]}
                onRename={() => selectAction('rename')}
                onDuplicate={() => selectAction('duplicate')}
                onDelete={() => selectAction('delete')}
              />
            </div>
            <div class="menu-row">
              <h2>Import diretto · Kobalte</h2>
              <KobalteMenu>
                <KobalteMenu.Trigger class="raw-trigger">
                  Apri Kobalte
                </KobalteMenu.Trigger>
                <KobalteMenu.Portal>
                  <KobalteMenu.Content class="raw-menu">
                    <KobalteMenu.Item onSelect={() => selectAction('kobalte')}>
                      {directLabel()}
                    </KobalteMenu.Item>
                  </KobalteMenu.Content>
                </KobalteMenu.Portal>
              </KobalteMenu>
            </div>
          </Show>
        </div>
      </section>
    </main>
  );
}

render(() => <App />, document.getElementById('app'));
