import {Transition} from 'solid-headless';
import {Component} from 'solid-js';
import * as styles from './Transition.css';

interface FadeInOutTransitionProps {
  show: boolean;
}

export const FadeInOutTransition: Component<
  FadeInOutTransitionProps
> = props => {
  return (
    <Transition
      show={props.show}
      enter={styles.fadeInOut.enter}
      enterTo={styles.fadeInOut.enterTo}
      enterFrom={styles.fadeInOut.enterFrom}
      leave={styles.fadeInOut.leave}
      leaveTo={styles.fadeInOut.leaveTo}
      leaveFrom={styles.fadeInOut.leaveFrom}
    >
      {props.children}
    </Transition>
  );
};
