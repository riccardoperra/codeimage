import {Component} from 'solid-js';
import {useFloating} from '../../core/floating-ui/floating-ui';
import {Popover, PopoverButton} from 'solid-headless';
import {sprinkles} from '../../theme/sprinkles.css';
import {DropdownMenu} from '../ui/Dropdown/DropdownPanel';
import {DropdownPortal} from '../ui/Dropdown/DropdownPortal';
import {ShadowForm} from './ShadowForm';
import {themeVars} from '../../theme/global.css';

import * as fieldStyles from '../ui/TextField/TextField.css';
import clsx from 'clsx';

export const ShadowField: Component<unknown> = () => {
  const floating = useFloating({
    placement: 'right-start',
  });

  return (
    <>
      <Popover
        class={sprinkles({
          display: 'flex',
          width: '100%',
        })}
        defaultOpen={false}
      >
        {({isOpen}) => (
          <>
            <PopoverButton
              class={clsx(
                fieldStyles.wrapper,
                sprinkles({
                  fontSize: 'sm',
                  paddingX: '2',
                  width: '100%',
                }),
              )}
              style={{
                flex: '1',
              }}
              ref={floating.setReference}
            >
              Shadow - test click
            </PopoverButton>

            <DropdownPortal
              isOpen={isOpen()}
              mount={document.getElementById('portal-host')}
            >
              <DropdownMenu
                unmount={false}
                ref={floating.setFloating}
                title={'Shadow'}
                style={{
                  position: floating.strategy,
                  left: `12px`,
                  top: `${floating.y ?? 0}px`,
                }}
              >
                <div
                  style={{
                    'background-color': themeVars.backgroundColor.gray['100'],
                  }}
                  class={sprinkles({
                    paddingX: '5',
                    paddingY: '8',
                  })}
                >
                  <ShadowForm />
                </div>
              </DropdownMenu>
            </DropdownPortal>
          </>
        )}
      </Popover>
    </>
  );
};
