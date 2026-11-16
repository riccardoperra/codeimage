import {Match, Switch} from 'solid-js';
import type {VariantMeta, VariantProps} from '../../contract';
import {preferences} from '../../shell/preferences';
import {Accordion} from './Accordion';
import {Rail} from './Rail';

export const meta: VariantMeta = {
  name: 'editor.sidebar',
  axis: 'The same sections beside the canvas, as an accordion or a rail',
};

/** The navigation is an appearance preference; the sections inside are the same. */
export default function Sidebar(props: VariantProps) {
  return (
    <Switch>
      <Match when={preferences.panelNav() === 'accordion'}>
        <Accordion {...props} />
      </Match>
      <Match when={preferences.panelNav() === 'rail'}>
        <Rail {...props} />
      </Match>
    </Switch>
  );
}
