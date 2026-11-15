import {ControlRow as SharedRow} from '../../controls/ControlRow';
import type {Control} from '../../model';
import * as styles from './inspector.css';

export function ControlRow(props: {control: Control}) {
  return (
    <SharedRow
      control={props.control}
      prefix="inspector"
      listClass={styles.selectPortal}
    />
  );
}
