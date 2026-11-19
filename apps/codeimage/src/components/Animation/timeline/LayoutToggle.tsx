import {button as canvasButton} from '../../../pages/UnifiedEditor/controls/canvas-toolbar.css';
import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {setTimelineLayout, timelineLayout} from './layout';

function CardsIcon(props: {label: string}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      role="img"
      aria-label={props.label}
    >
      <title>{props.label}</title>
      <rect x="1.75" y="3.75" width="5.5" height="8.5" rx="1.5" />
      <rect x="8.75" y="3.75" width="5.5" height="8.5" rx="1.5" />
    </svg>
  );
}

function ListIcon(props: {label: string}) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      role="img"
      aria-label={props.label}
    >
      <title>{props.label}</title>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </svg>
  );
}

export function LayoutToggle() {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <div data-timeline-layout-toggle>
      <SegmentedField
        itemClass={canvasButton}
        size="xs"
        value={timelineLayout()}
        onChange={setTimelineLayout}
        items={[
          {
            label: <CardsIcon label={t('animation.timeline.cards')} />,
            value: 'filmstrip',
          },
          {
            label: <ListIcon label={t('animation.timeline.list')} />,
            value: 'outline',
          },
        ]}
      />
    </div>
  );
}
