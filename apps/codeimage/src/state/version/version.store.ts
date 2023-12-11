import {withIndexedDbPlugin} from '@codeimage/store/plugins/withIndexedDbPlugin';
import {appEnvironment} from '@core/configuration';
import {getUmami} from '@core/constants/umami';
import {createControlledDialog} from '@core/hooks/createControlledDialog';
import {
  Accessor,
  createEffect,
  createSignal,
  getOwner,
  on,
  onMount,
  runWithOwner,
  untrack,
} from 'solid-js';
import {unwrap} from 'solid-js/store';
import {defineStore} from 'statebuilder';
import {Changelog} from '../../components/Changelog/Changelog';
import {parseChangelogFilePath} from '../../components/Changelog/resolveChangelog';

interface Feature {
  name: string;
  seen: Record<string, number>;
}

interface FeatureInfo extends Feature {
  viewsByVersion(version: string): number;

  viewsByCurrentVersion(): number;

  totalViews(): number;
}

interface VersionStore {
  appVersion: string;
  previousAppVersion: string | null;
  seen: string[];
  features: Record<FeatureName, Feature>;
}

export type FeatureName = 'fontPicker' | 'windowStylePicker';

const ChangelogFiles = Object.keys(
  import.meta.glob('../../../changelog/*.mdx'),
).map(parseChangelogFilePath);

function initialValue(): VersionStore {
  return {
    appVersion: appEnvironment.version,
    previousAppVersion: null,
    seen: [],
    features: {
      fontPicker: {
        name: 'Font Picker',
        seen: {[appEnvironment.version]: 0},
      },
      windowStylePicker: {
        name: 'Window Style Picker',
        seen: {[appEnvironment.version]: 0},
      },
    },
  };
}
export const VersionStore = defineStore<VersionStore>(initialValue)
  .extend(withIndexedDbPlugin<VersionStore | null>('version', initialValue()))
  .extend(_ => {
    const [ready, setReady] = createSignal(false);
    const controlledDialog = createControlledDialog();

    function updateWithLatestVersionSeen(
      currentVersion: string,
      data: VersionStore,
    ): VersionStore {
      const versionSeen = new Set([...data.seen, currentVersion]);
      data.seen = [...versionSeen];
      return data;
    }

    onMount(() => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const owner = getOwner()!;
      _.idb
        .get()
        .then(data => {
          if (data) {
            const currentVersion = appEnvironment.version;
            const previousVersion = data.appVersion;
            const isFirstTime = data.seen.length === 0;
            const hasNewUpdate = !data.seen.includes(currentVersion);
            if (currentVersion !== previousVersion) {
              data.appVersion = currentVersion;
              data.previousAppVersion = previousVersion;
              console.info(
                `New app version: ${previousVersion} -> ${currentVersion}`,
              );
              Object.values(data.features).forEach(feature => {
                feature.seen[currentVersion] = 0;
              });
            }
            if (isFirstTime || hasNewUpdate) {
              const fileVersions = ChangelogFiles.map(({version}) => version);
              const hasNewVersionToSee = fileVersions.includes(data.appVersion);
              console.log(isFirstTime, hasNewUpdate, hasNewVersionToSee);

              if (isFirstTime || hasNewVersionToSee) {
                controlledDialog(Changelog, {latest: true});
                const updatedData = updateWithLatestVersionSeen(
                  currentVersion,
                  data,
                );
                _.set(() => updatedData);
              } else {
                _.set(() => data);
              }
            } else {
              _.set(() => updateWithLatestVersionSeen(currentVersion, data));
            }
            setReady(true);
          }

          runWithOwner(owner, () =>
            createEffect(on(_, state => _.idb.set(unwrap(state)))),
          );
        })
        .finally(() => setReady(true));
    });

    return {
      ready,
      see(featureName: FeatureName, log?: boolean) {
        if (!untrack(() => _().features.hasOwnProperty(featureName))) {
          console.warn(`Feature ${featureName} does not exists.`);
          return;
        }
        _.set('features', featureName, 'seen', value => {
          return {
            ...value,
            [appEnvironment.version]: (value[appEnvironment.version] ?? 0) + 1,
          };
        });
        if (log) {
          getUmami().trackEvent('open', featureName);
        }
      },
      getFeature(
        featureNameAccessor: Accessor<string>,
      ): Accessor<FeatureInfo | null> {
        return () => {
          if (!ready()) return null;
          const features = _.get.features;
          const featureName = featureNameAccessor();
          if (!features[featureName as FeatureName]) {
            return null;
          }

          const feature = features[featureName as FeatureName];

          const featureInfo: FeatureInfo = {
            name: feature.name,
            seen: feature.seen,
            viewsByVersion(version: string): number {
              return feature.seen[version] ?? 0;
            },
            viewsByCurrentVersion(): number {
              return feature.seen[_.get.appVersion] ?? 0;
            },
            totalViews(): number {
              return Object.values(feature.seen).reduce((acc, n) => acc + n, 0);
            },
          };

          return featureInfo;
        };
      },
      seeOnOpeningEvent(options: {
        featureName: FeatureName;
        open: Accessor<boolean>;
        log: boolean;
      }) {
        const {featureName, open, log} = options;
        createEffect(
          on(
            open,
            open => {
              if (open) {
                this.see(featureName, log);
              }
            },
            {defer: true},
          ),
        );
      },
    };
  });
