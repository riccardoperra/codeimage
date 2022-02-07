import * as styles from './toolbar.css';
import {Button} from '../ui/Button';

export const Toolbar = () => {
  return (
    <div class={styles.wrapper}>
      Toolbar
      <Button variant={'solid'} theme={'primary'}>
        Export
      </Button>
    </div>
  );
};
