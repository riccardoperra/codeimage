import {JSXElement, Show} from 'solid-js';
import {styled} from '../../utils';
import {LoaderProps, Loading} from './Loading';
import {overlay} from './LoadingOverlay.css';

interface LoadingOverlayProps extends LoaderProps {
  overlay: boolean;
}

export function LoadingOverlay(props: LoadingOverlayProps): JSXElement {
  return (
    <Show
      when={props.overlay}
      fallback={<Loading width={props.width} height={props.height} />}
    >
      <styled.div class={overlay}>
        <Loading width={props.width} height={props.height} />
      </styled.div>
    </Show>
  );
}
