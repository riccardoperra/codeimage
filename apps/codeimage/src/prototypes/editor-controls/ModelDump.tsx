import {themeVars} from '@codeimage/ui';
import type {JSX} from 'solid-js';
import {For, Show} from 'solid-js';
import type {VariantProps} from './contract';
import type {Control} from './model';

const swatch = (background: string): JSX.CSSProperties => ({
  background,
  width: '20px',
  height: '20px',
});

function renderInput(control: Control): JSX.Element {
  switch (control.kind) {
    case 'toggle':
      return (
        <input
          type="checkbox"
          checked={control.value()}
          onChange={e => control.set(e.currentTarget.checked)}
        />
      );
    case 'segmented':
      return (
        <For each={control.options()}>
          {option => (
            <label>
              <input
                type="radio"
                name={control.id}
                value={option.key}
                checked={control.value() === option.key}
                disabled={control.disabled()}
                onChange={() => control.set(option.key)}
              />
              {option.label}
            </label>
          )}
        </For>
      );
    case 'select':
      return (
        <select
          disabled={control.disabled()}
          onChange={e => control.set(e.currentTarget.value)}
        >
          <For each={control.options()}>
            {option => (
              <option
                value={option.key}
                selected={control.value() === option.key}
              >
                {option.label}
              </option>
            )}
          </For>
        </select>
      );
    case 'range':
      return (
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={control.value()}
          onInput={e => control.set(e.currentTarget.valueAsNumber)}
        />
      );
    case 'number':
      return (
        <input
          type="number"
          min={control.min}
          max={control.max}
          value={control.value()}
          onChange={e => control.set(e.currentTarget.valueAsNumber)}
        />
      );
    case 'background':
      return (
        <>
          <input
            type="text"
            value={control.value()}
            onChange={e => control.set(e.currentTarget.value)}
          />
          <div style={{display: 'flex', 'flex-wrap': 'wrap'}}>
            <For each={[...control.gradients, ...control.colors]}>
              {value => (
                <button
                  title={value}
                  aria-pressed={control.value() === value}
                  style={swatch(value)}
                  onClick={() => control.set(value)}
                />
              )}
            </For>
          </div>
        </>
      );
    case 'custom':
      return <control.Control />;
  }
}

/** Every section, control, theme and action through native inputs. Proves the wiring; not a design. */
export function ModelDump(props: VariantProps) {
  return (
    <div data-model-dump style={{color: themeVars.dynamicColors.baseText}}>
      <section>
        <h3>Actions</h3>
        <props.stage.ExportButton />
        <props.stage.CopyToClipboardButton />
        <button onClick={() => props.stage.randomize()}>Randomize</button>
        <button
          disabled={!props.stage.canFormat()}
          onClick={() => props.stage.format()}
        >
          Format
        </button>
      </section>

      <For each={props.model.sections}>
        {section => (
          <section data-section={section.id}>
            <h3>{section.label()}</h3>
            <For each={section.controls}>
              {control => (
                <Show when={control.visible()}>
                  <div data-control={control.id} data-kind={control.kind}>
                    <div>{control.label()}</div>
                    {renderInput(control)}
                  </div>
                </Show>
              )}
            </For>
          </section>
        )}
      </For>

      <section data-section="themes">
        <h3>Themes ({props.model.themes().length})</h3>
        <For each={props.model.themes()}>
          {theme => (
            <button
              data-theme-id={theme.id}
              aria-pressed={theme.active()}
              onClick={() => theme.apply()}
            >
              {theme.name} ({theme.dark ? 'dark' : 'light'})
            </button>
          )}
        </For>
      </section>
    </div>
  );
}
