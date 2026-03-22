import type {PropsWithChildren} from 'solid-js';
import {styled} from '../../utils';
import type {FlexFieldVariants} from './FlexField.css';
import {wrapper} from './FlexField.css';

export function FlexField(
  props: PropsWithChildren<NonNullable<FlexFieldVariants>>,
) {
  return (
    <styled.div class={wrapper({size: props.size})} children={props.children} />
  );
}
