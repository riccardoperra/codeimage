import {ElementType} from '@solid-aria/types';
import {
  Transition,
  TransitionChild,
  TransitionChildProps,
  TransitionProps,
} from 'solid-headless';
import {JSXElement} from 'solid-js';
import * as styles from './Transition.css';

type FadeInOutTransitionProps<T extends ElementType> =
  | ({childTransition: true} & TransitionChildProps<T>)
  | ({childTransition?: boolean; show: boolean} & TransitionProps<T>);

/**
 * @deprecated Should convert to motion animation
 */
export function FadeInOutTransition<T extends ElementType>(
  props: FadeInOutTransitionProps<T>,
): JSXElement {
  return (
    <>
      {props.childTransition ? (
        <TransitionChild
          {...props}
          enter={styles.fadeInOut.enter}
          enterTo={styles.fadeInOut.enterTo}
          enterFrom={styles.fadeInOut.enterFrom}
          leave={styles.fadeInOut.leave}
          leaveTo={styles.fadeInOut.leaveTo}
          leaveFrom={styles.fadeInOut.leaveFrom}
        >
          {props.children}
        </TransitionChild>
      ) : (
        <Transition
          {...props}
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
      )}
    </>
  );
}

export function FadeInOutWithScaleTransition<T extends ElementType>(
  props: FadeInOutTransitionProps<T>,
): JSXElement {
  return (
    <>
      {props.childTransition ? (
        <TransitionChild
          {...props}
          enter={styles.fadeInOutWithScale.enter}
          enterTo={styles.fadeInOutWithScale.enterTo}
          enterFrom={styles.fadeInOutWithScale.enterFrom}
          leave={styles.fadeInOutWithScale.leave}
          leaveTo={styles.fadeInOutWithScale.leaveTo}
          leaveFrom={styles.fadeInOutWithScale.leaveFrom}
        >
          {props.children}
        </TransitionChild>
      ) : (
        <Transition
          {...props}
          show={props.show}
          enter={styles.fadeInOutWithScale.enter}
          enterTo={styles.fadeInOutWithScale.enterTo}
          enterFrom={styles.fadeInOutWithScale.enterFrom}
          leave={styles.fadeInOutWithScale.leave}
          leaveTo={styles.fadeInOutWithScale.leaveTo}
          leaveFrom={styles.fadeInOutWithScale.leaveFrom}
        >
          {props.children}
        </Transition>
      )}
    </>
  );
}
