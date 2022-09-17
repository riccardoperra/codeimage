import {JSXElement, Show} from 'solid-js';
import {omitProps} from 'solid-use';
import {styled} from '../../utils';
import {LoaderProps, Loading} from './Loading';
import {overlay} from './LoadingOverlay.css';

interface LoadingOverlayProps extends LoaderProps {
  overlay: boolean;
}

export function LoadingOverlay(props: LoadingOverlayProps): JSXElement {
  const loadingProps = omitProps(props, ['overlay']);
  return (
    <Show when={props.overlay} fallback={<Loading {...loadingProps} />}>
      <styled.div class={overlay}>
        <Loading {...loadingProps} />
      </styled.div>
    </Show>
  );
}
