import {App} from '../../../../pages/Editor/App';
import type {VariantMeta} from '../../contract';

export const meta: VariantMeta = {
  name: 'Current',
  axis: "Today's production layout, as the reference",
  ownThemePicker: true,
};

export default function Current() {
  return <App />;
}
