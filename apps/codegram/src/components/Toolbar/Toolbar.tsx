import * as styles from './toolbar.css';
import {Button} from '../ui/Button/Button';
import {sprinkles} from '../../theme/sprinkles.css';
import {PaddingBox} from './PaddingBox';
import {frameState, updatePadding} from '../../+state/frame.state';
import {rx} from '../../+state/rx';

export const Toolbar = () => {
  const sizes = [16, 32, 64, 128];
  const state = rx(frameState);

  return (
    <div class={styles.wrapper}>
      <PaddingBox
        selected={state.padding}
        sizes={sizes}
        onChange={updatePadding}
      />

      <Button
        class={sprinkles({
          marginLeft: 'auto',
        })}
        variant={'solid'}
        theme={'primary'}
      >
        Export
      </Button>
    </div>
  );
};
