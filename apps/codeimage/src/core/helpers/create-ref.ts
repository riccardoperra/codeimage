import {
  DynamicNode,
  WithRef,
} from 'solid-headless/dist/types/utils/dynamic-prop';
import {ValidConstructor} from 'solid-headless/src/utils/dynamic-prop';

type RefCallback<T> = (el: T) => void;
type RefField<T> = T | RefCallback<T>;

// Taken from solid-headless, currently not exported
// TODO: open pr
// https://github.com/LXSMNSYC/solid-headless/blob/main/packages/solid-headless/src/utils/dynamic-prop.ts
function isRefFunction<U extends ValidConstructor>(
  callback?: RefField<DynamicNode<U>>,
): callback is RefCallback<DynamicNode<U>> {
  return typeof callback === 'function';
}

/**
 * @deprecated should use mergeRefs
 * @param props
 * @param callback
 */
export function createRef<U extends ValidConstructor>(
  props: WithRef<U>,
  callback: RefCallback<DynamicNode<U>>,
): RefCallback<DynamicNode<U>> {
  return e => {
    if ('ref' in props) {
      if (isRefFunction(props.ref)) {
        props.ref(e);
      } else {
        props.ref = e;
      }
    }
    callback(e);
  };
}
