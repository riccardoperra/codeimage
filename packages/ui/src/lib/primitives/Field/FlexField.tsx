import {FlexFieldVariants, wrapper} from './FlexField.css';
import {PropsWithChildren} from 'solid-js';
import {Dynamic} from 'solid-js/web';

export function FlexField(props: PropsWithChildren<FlexFieldVariants>) {
  // TODO: why pure div not working?
  return (
    <>
      <Dynamic
        component={'div'}
        class={wrapper({size: props.size})}
        children={props.children}
      />
    </>
  );
}
