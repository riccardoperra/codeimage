import {createSignal, flush} from 'solid-js';
import {ReadOnlyCloneButton} from '../../src/pages/UnifiedEditor/ReadOnlyCloneButton';
import type {ReadOnlyNoticeProps} from '../../src/pages/UnifiedEditor/read-only-notice-props';
import {createSolid2Mount} from './create-solid2-mount';

function ReadOnlyNotice(props: ReadOnlyNoticeProps) {
  const [pending, setPending] = createSignal(false);

  async function clone() {
    if (pending()) return;
    flush(() => setPending(true));
    try {
      await props.onClone();
    } catch {
      return;
    } finally {
      setPending(false);
    }
  }

  return (
    <div class={props.bannerClass} data-read-only-banner>
      <span class={props.titleClass}>{props.title}</span>
      <ReadOnlyCloneButton
        label={props.cloneLabel}
        pending={pending()}
        buttonClass={props.buttonClass}
        onClick={clone}
      />
    </div>
  );
}

export const mountReadOnlyNotice = createSolid2Mount(ReadOnlyNotice);
