import * as styles from './toolbar.css';
import {Button} from '../ui/Button/Button';
import {Toggle} from '../ui/Toggle/Toggle';

export const Toolbar = () => {
  return (
    <div class={styles.wrapper}>
      <Toggle />

      <Button class={'test'} variant={'solid'} theme={'primary'}>
        Export
      </Button>
    </div>
  );
};
