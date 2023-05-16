import {SvgIcon} from '@codeimage/ui';
import {IconButton, Popover, PopoverTrigger, Tooltip} from '@codeui/kit';
import {As} from '@kobalte/core';
import {ExportPopoverContent} from './ExportContent';

export function ExportSettingsButton() {
  return (
    <Tooltip content={'Export settings'} theme={'secondary'}>
      <Popover placement={'bottom-end'}>
        <PopoverTrigger asChild>
          <As
            component={IconButton}
            aria-label={'hint'}
            size={'xs'}
            theme={'secondary'}
          >
            <SvgIcon
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              class="w-6 h-6"
            >
              <path d="M18.75 12.75h1.5a.75.75 0 000-1.5h-1.5a.75.75 0 000 1.5zM12 6a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 6zM12 18a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 0112 18zM3.75 6.75h1.5a.75.75 0 100-1.5h-1.5a.75.75 0 000 1.5zM5.25 18.75h-1.5a.75.75 0 010-1.5h1.5a.75.75 0 010 1.5zM3 12a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 013 12zM9 3.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5zM12.75 12a2.25 2.25 0 114.5 0 2.25 2.25 0 01-4.5 0zM9 15.75a2.25 2.25 0 100 4.5 2.25 2.25 0 000-4.5z" />
            </SvgIcon>
          </As>
        </PopoverTrigger>
        <ExportPopoverContent />
      </Popover>
    </Tooltip>
  );
}
