import {Component} from 'solid-js';
import {useFloating} from '../../core/floating-ui/floating-ui';
import {Popover, PopoverButton} from 'solid-headless';
import {sprinkles, textFieldStyles, themeVars} from '@codeimage/ui';
import {DropdownMenu} from '@codeimage/ui';
import {DropdownPortal} from '@codeimage/ui';
import {ShadowForm} from './ShadowForm';
import clsx from 'clsx';

interface ShadowFieldProps {
  value: string;
  onChange: (shadow: string) => void;
}

export const ShadowField: Component<ShadowFieldProps> = props => {
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
                textFieldStyles.baseField,
                sprinkles({
                  fontSize: 'sm',
                  paddingX: 2,
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
                    paddingX: 5,
                    paddingY: 8,
                  })}
                >
                  <ShadowForm onChange={props.onChange} />
                </div>
              </DropdownMenu>
            </DropdownPortal>
          </>
        )}
      </Popover>
    </>
  );
};
