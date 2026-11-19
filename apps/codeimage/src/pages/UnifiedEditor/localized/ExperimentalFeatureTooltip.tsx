import type {AppLocaleEntries} from '../../../i18n';
import {useI18n} from '@codeimage/locale';
import {Box, Link} from '@codeimage/ui';
import {Tooltip} from '@ui/legacy-controls';
import * as styles from '../../../ui/ExperimentalFeatureTooltip/ExperimentalFeatureTooltip.css';
import type {FlowProps} from 'solid-js';

interface ExperimentalFeatureTooltipProps {
  feature: string;
}

export {ExperimentalIcon} from '../../../ui/ExperimentalFeatureTooltip/ExperimentalFeatureTooltip';

export function ExperimentalFeatureTooltip(
  props: FlowProps<ExperimentalFeatureTooltipProps>,
) {
  const [t] = useI18n<AppLocaleEntries>();
  return (
    <Tooltip
      slotClasses={{
        content: styles.tooltip,
      }}
      content={
        <>
          {t('editor.experimentalHint', {feature: props.feature})}
          <Box as={'span'} marginLeft={'1'}>
            <Link
              underline
              as={'a'}
              target={'_blank'}
              href={'https://github.com/riccardoperra/codeimage/issues'}
            >
              {t('editor.repository')}
            </Link>
          </Box>
        </>
      }
    >
      {props.children}
    </Tooltip>
  );
}
