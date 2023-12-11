import {VersionStore} from '@codeimage/store/version/version.store';
import {Presence, Motion} from '@motionone/solid';
import {Show} from 'solid-js';
import {provideState} from 'statebuilder';
import * as styles from './FeatureBadge.css';

interface FeatureBadgeProps {
  featureName: string;
  untilSeenTimes: number;
}

export function FeatureBadge(props: FeatureBadgeProps) {
  const versionStore = provideState(VersionStore);

  const feature = versionStore.getFeature(() => props.featureName);

  return (
    <Show when={feature()}>
      {feature => (
        <Presence>
          <Show when={feature().totalViews() < props.untilSeenTimes}>
            <Motion.div
              animate={{opacity: [0, 1]}}
              exit={{opacity: [1, 0]}}
              class={styles.badge}
            >
              New
            </Motion.div>
          </Show>
        </Presence>
      )}
    </Show>
  );
}
