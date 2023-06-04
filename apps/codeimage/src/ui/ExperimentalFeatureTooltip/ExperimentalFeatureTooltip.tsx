import {Box, Link, SvgIcon, SvgIconProps} from '@codeimage/ui';
import {Tooltip} from '@codeui/kit';
import * as styles from './ExperimentalFeatureTooltip.css';
import {FlowProps} from 'solid-js';

interface ExperimentalFeatureTooltipProps {
  feature: string;
}

export function ExperimentalIcon(props: SvgIconProps) {
  return (
    <SvgIcon
      class="icon"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      {...props}
    >
      <path
        d="M90.72 82.34c4.4 7 1.29 12.66-7 12.66H16.25C8 95 4.88 89.31 9.28 82.34l29.47-46.46V12.5H35A3.75 3.75 0 0135 5h30a3.75 3.75 0 010 7.5h-3.75v23.38zM45.08 39.86L29.14 65h41.72L54.92 39.86l-1.17-1.81V12.5h-7.5v25.55z"
        fill="currentColor"
      />
    </SvgIcon>
  );
}

export function ExperimentalFeatureTooltip(
  props: FlowProps<ExperimentalFeatureTooltipProps>,
) {
  return (
    <Tooltip
      slotClasses={{
        content: styles.tooltip,
      }}
      content={
        <>
          {props.feature} is an experimental feature. For any issues or feedback
          please fill an issue on
          <Box as={'span'} marginLeft={'1'}>
            <Link
              underline
              as={'a'}
              target={'_blank'}
              href={'https://github.com/riccardoperra/codeimage/issues'}
            >
              github repository.
            </Link>
          </Box>
        </>
      }
    >
      {props.children}
    </Tooltip>
  );
}
