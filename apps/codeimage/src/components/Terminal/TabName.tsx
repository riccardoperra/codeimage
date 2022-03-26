import {createMemo, For, JSXElement} from 'solid-js';
import {Box} from '../ui/Box/Box';
import * as styles from './terminal.css';
import {appEnvironment} from '../../core/configuration';
import {TabIcon} from './TabIcon';
import {highlight as _highlight} from '../../core/directives/highlight';

import '@lion/combobox/define';
import '@lion/listbox/define';
import {LionCombobox} from '@lion/combobox';
import {LionOption} from '@lion/listbox';
import {css} from '@lion/core';

declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'codeimage-combobox': Partial<
        CodeImageCombobox &
          JSX.DOMAttributes<CodeImageCombobox> & {children: any}
      >;
      'codeimage-option': Partial<
        CodeImageOption & JSX.DOMAttributes<CodeImageOption> & {children: any}
      >;
    }
  }
}

interface TabNameProps {
  readonly: boolean;
  value?: string;
  onValueChange?: (value: string) => void;
}

class CodeImageCombobox extends LionCombobox {
  static styles = [
    ...super.styles,
    css`
      :host {
        font-family: 'Inter', system-ui, -apple-system;
        display: inline-block;
      }

      .input-group__container {
        border: none;
      }
    `,
  ];
}

class CodeImageOption extends LionOption {
  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }
}

customElements.define('codeimage-combobox', CodeImageCombobox);
customElements.define('codeimage-option', CodeImageOption);

const highlight = _highlight;

export function TabName(props: TabNameProps): JSXElement {
  const hasDot = /^[a-zA-Z0-9]{2,}\./;

  const showHint = createMemo(() => {
    return hasDot.test(props.value ?? '');
  });

  function onChange(value: string): void {
    if (props.onValueChange) {
      props.onValueChange(value);
    }
  }

  const icons = appEnvironment.languages.flatMap(language => language.icons);

  const extension = createMemo(() => {
    if (!props.value) return '';
    const extension = /\.[0-9a-z]+$/i.exec(props.value);
    return (extension ? extension[0] : '').replace('.', '');
  });

  const matchedIcons = createMemo(() => {
    if (!props.value) {
      return icons;
    }

    const currentExtension = extension();

    return icons.filter(icon => icon.extension.includes(currentExtension));
  });

  return (
    <codeimage-combobox
      onSelect={(e: any) => console.log(e)}
      onInput={event => onChange((event.target as any).value)}
      name="tabName"
      modelValue={props.value}
      prop:autocomplete={'none'}
      prop:matchCondition={(option: LionOption, text: string) => {
        const extension = /\.[0-9a-z]+$/i.exec(text);
        const ext = (extension ? extension[0] : '').replace('.', '');
        const choice = option.choiceValue as string;
        return choice.includes(ext);
      }}
    >
      <Box class={styles.tabHint} display={showHint() ? 'block' : 'none'}>
        <For each={matchedIcons()}>
          {icon => (
            <codeimage-option
              prop:choiceValue={icon.extension.replace('.', '')}
              class={styles.tabHintDropdownOption}
            >
              {() => (
                <Box class={styles.tabHintDropdownItemContent}>
                  <TabIcon delay={0} content={icon.content} />
                  <div use:highlight={extension()}>{icon.extension}</div>
                </Box>
              )}
            </codeimage-option>
          )}
        </For>
      </Box>
    </codeimage-combobox>
  );
}
