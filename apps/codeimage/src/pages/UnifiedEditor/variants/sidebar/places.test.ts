import {expectTypeOf, it} from 'vitest';
import type {ControlId} from '../../model';
import type {
  PLACES as DockPlaces,
  PanelId as DockPanelId,
} from '../dock/fields';
import type {PanelId} from './panels';
import type {PLACES} from './places';

it('requires a panel for every control in the Sidebar and Dock', () => {
  expectTypeOf<keyof typeof PLACES>().toEqualTypeOf<ControlId>();
  expectTypeOf<typeof PLACES>().toExtend<Record<ControlId, {panel: PanelId}>>();
  expectTypeOf<typeof DockPlaces>().toExtend<
    Record<ControlId, {panel: DockPanelId}>
  >();
});
