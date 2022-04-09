import {PropsWithChildren} from 'solid-js';
import {styled} from '../../utils';
import {FlexFieldVariants, wrapper} from './FlexField.css';

export function FlexField(props: PropsWithChildren<FlexFieldVariants>) {
  return (
    <styled.div class={wrapper({size: props.size})} children={props.children} />
  );
}
