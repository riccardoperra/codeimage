import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {Tooltip} from '@codeui/kit';
import {SegmentedField} from '@ui/SegmentedField/SegmentedField';
import {setTimelineLayout, timelineLayout} from './layout';

function CardsIcon() {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      role="img"
      aria-label={t('animation.timeline.cards')}
    >
      <title>{t('animation.timeline.cards')}</title>
      <rect x="1.75" y="3.75" width="5.5" height="8.5" rx="1.5" />
      <rect x="8.75" y="3.75" width="5.5" height="8.5" rx="1.5" />
    </svg>
  );
}

function ListIcon() {
  const [t] = useI18n<AppLocaleEntries>();
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
      aria-label={t('animation.timeline.list')}
    >
      <title>{t('animation.timeline.list')}</title>
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </svg>
  );
}

export function LayoutToggle() {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <div data-timeline-layout-toggle>
      <SegmentedField
        size="xs"
        value={timelineLayout()}
        onChange={setTimelineLayout}
        items={[
          {
            label: (
              <Tooltip content={t('animation.timeline.cards')} placement="top">
                <CardsIcon />
              </Tooltip>
            ),
            value: 'filmstrip',
          },
          {
            label: (
              <Tooltip content={t('animation.timeline.list')} placement="top">
                <ListIcon />
              </Tooltip>
            ),
            value: 'outline',
          },
        ]}
      />
    </div>
  );
}
