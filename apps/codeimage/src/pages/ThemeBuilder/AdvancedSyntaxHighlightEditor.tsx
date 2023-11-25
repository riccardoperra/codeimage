import {SegmentedControl, SegmentedControlItem} from '@codeui/kit';
import {Index} from 'solid-js';
import {provideState} from 'statebuilder';
import {CustomColorPicker} from '../../components/PropertyEditor/controls/CustomColorPicker';
import {EditorForm} from '../../components/PropertyEditor/EditorForm';
import {
  PanelRow,
  TwoColumnPanelRow,
} from '../../components/PropertyEditor/PanelRow';
import {ThemeBuilderStore} from './theme-builder.store';

export function AdvancedSyntaxHighlightEditor() {
  const store = provideState(ThemeBuilderStore);

  return (
    <EditorForm>
      <SegmentedControl size={'md'} style={{width: '100%'}}>
        <SegmentedControlItem value={'Simple'}>Simple</SegmentedControlItem>
        <SegmentedControlItem value={'Advanced'}>Advanced</SegmentedControlItem>
      </SegmentedControl>

      <Index each={Object.keys(store.get.syntax)}>
        {key => (
          <PanelRow for={key()} label={key()}>
            <TwoColumnPanelRow>
              <CustomColorPicker
                onChange={color => store.set('syntax', key(), color)}
                value={store.get.syntax[key()]}
              />
            </TwoColumnPanelRow>
          </PanelRow>
        )}
      </Index>
    </EditorForm>
  );
}
