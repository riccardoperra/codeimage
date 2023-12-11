import {icons, Link} from '@codeui/kit';
import {browser} from '@core/hooks/createPlatformProps';
import {Alert} from '@ui/Alert/Alert';
import {createResource, Match, Show, Suspense, Switch} from 'solid-js';
import {CloseIcon} from '../Icons/CloseIcon';
import {ExclamationAltIcon} from '../Icons/Exclamation';
import ChromeUrl from './browserSvgs/chrome.png';
import EdgeUrl from './browserSvgs/edge.png';
import FirefoxUrl from './browserSvgs/firefox.png';
import OperaUrl from './browserSvgs/opera.png';
import SafariUrl from './browserSvgs/safari.svg';
import {getWindowMdnCompatibilityApi} from './compatibility/api';
import {CompatStatement, SupportStatement} from './compatibility/types';
import * as styles from './UnsupportedFeatureBanner.css';

type BrowserType = 'chrome' | 'safari' | 'edge' | 'firefox' | 'opera';

interface UnsupportedFeatureBannerProps {
  supported: boolean;
  featureName: string;
  compatibilityTableLink?: string;
}

export function FeatureCheckBanner(props: UnsupportedFeatureBannerProps) {
  const [api] = createResource(() => getWindowMdnCompatibilityApi());

  return (
    <Alert class={styles.unsupportedBanner} fluid>
      <span class={styles.bannerText}>
        <Show when={props.supported}>
          <icons.CheckIcon /> This feature is compatible with your browser.
        </Show>
        <Show when={!props.supported}>
          <ExclamationAltIcon /> This feature is not supported by your browser.
        </Show>
      </span>
      <div class={styles.supportedTableGridContainer}>
        <Suspense>
          <Show when={api()}>
            {api => (
              <SupportedTableCompatGrid
                data={api().api.Window.queryLocalFonts.__compat!}
              />
            )}
          </Show>
        </Suspense>
      </div>
      <Show when={props.compatibilityTableLink}>
        {link => (
          <Link
            class={styles.compatibilityTableLink}
            variant={'underline'}
            href={link()}
            target={'_blank'}
          >
            Check the full compatibility table
          </Link>
        )}
      </Show>
    </Alert>
  );
}

export function SupportedTableCompatGrid(props: {data: CompatStatement}) {
  return (
    <div class={styles.supportedTableGrid}>
      <SupportedTableGridItem
        type={'chrome'}
        data={props.data.support.chrome}
      />
      <SupportedTableGridItem type={'edge'} data={props.data.support.chrome} />
      <SupportedTableGridItem
        type={'safari'}
        data={props.data.support.safari}
      />
      <SupportedTableGridItem
        type={'firefox'}
        data={props.data.support.firefox}
      />
      <SupportedTableGridItem type={'opera'} data={props.data.support.opera} />
    </div>
  );
}

export function SupportedTableGridItem(props: {
  type: BrowserType;
  data: SupportStatement | undefined;
}) {
  const simpleSupportStatement = () =>
    Array.isArray(props.data) ? props.data[0] : props.data;

  const Icon = () => {
    switch (props.type) {
      case 'chrome':
        return (
          <img alt={'Chrome logo'} src={ChromeUrl} width={20} height={20} />
        );
      case 'safari':
        return (
          <img alt={'Safari logo'} src={SafariUrl} width={20} height={20} />
        );
      case 'firefox':
        return (
          <img alt={'Firefox logo'} src={FirefoxUrl} width={20} height={20} />
        );
      case 'opera':
        return <img alt={'Opera logo'} src={OperaUrl} width={20} height={20} />;
      case 'edge':
        return <img alt={'Edge logo'} src={EdgeUrl} width={20} height={20} />;
    }
  };

  const version = () => {
    const support = simpleSupportStatement();
    if (!support) {
      return null;
    }
    if (typeof support.version_added === 'string') {
      return `${support.version_added}+`;
    }
    return support.version_added;
  };

  const current = () => {
    return browser() === props.type;
  };

  return (
    <div
      class={styles.supportedTableGridItem}
      data-supported={!!version() ? '' : undefined}
      data-unsupported={version() === false ? '' : undefined}
      data-current={current() ? '' : undefined}
    >
      <Icon />

      <Switch>
        <Match when={typeof version() === 'string'}>{version()}</Match>
        <Match when={typeof version() === 'boolean' && version() === false}>
          <CloseIcon />
        </Match>
      </Switch>
    </div>
  );
}
