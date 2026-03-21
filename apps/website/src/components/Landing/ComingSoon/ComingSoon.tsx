import type {JSX, FlowProps} from 'solid-js';
import {createSignal, onMount} from 'solid-js';
import {Motion} from 'solid-motionone';
import {animate, inView, scroll} from 'motion';
import {
  FeatureCard,
  FeatureContent,
  FeatureImageContent,
} from '~/components/FeatureCard/FeatureCard';
import {injectBreakpoints} from '~/theme/breakpoints';
import styles from './ComingSoon.module.css';

function PaintBrush(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fill-rule="evenodd"
        d="M20.599 1.5c-.376 0-.743.111-1.055.32l-5.08 3.385a18.747 18.747 0 00-3.471 2.987 10.04 10.04 0 014.815 4.815 18.748 18.748 0 002.987-3.472l3.386-5.079A1.902 1.902 0 0020.599 1.5zm-8.3 14.025a18.76 18.76 0 001.896-1.207 8.026 8.026 0 00-4.513-4.513A18.75 18.75 0 008.475 11.7l-.278.5a5.26 5.26 0 013.601 3.602l.502-.278zM6.75 13.5A3.75 3.75 0 003 17.25a1.5 1.5 0 01-1.601 1.497.75.75 0 00-.7 1.123 5.25 5.25 0 009.8-2.62 3.75 3.75 0 00-3.75-3.75z"
        clip-rule="evenodd"
      />
    </svg>
  );
}

function ChartPie(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fill-rule="evenodd"
        d="M2.25 13.5a8.25 8.25 0 018.25-8.25.75.75 0 01.75.75v6.75H18a.75.75 0 01.75.75 8.25 8.25 0 01-16.5 0z"
        clip-rule="evenodd"
      />
      <path
        fill-rule="evenodd"
        d="M12.75 3a.75.75 0 01.75-.75 8.25 8.25 0 018.25 8.25.75.75 0 01-.75.75h-7.5a.75.75 0 01-.75-.75V3z"
        clip-rule="evenodd"
      />
    </svg>
  );
}

function DocumentText(props: JSX.IntrinsicElements['svg']) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path
        fill-rule="evenodd"
        d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
        clip-rule="evenodd"
      />
      <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
    </svg>
  );
}

export default function ComingSoon() {
  let analyticsCardRef!: HTMLDivElement;
  let themeBuilderRef!: HTMLDivElement;
  let embedsRef!: HTMLDivElement;
  const bp = injectBreakpoints();
  const [analyticsInView, setAnalyticsInView] = createSignal(true);

  onMount(() => {
    if (!bp.isXs()) {
      [analyticsCardRef, themeBuilderRef, embedsRef].forEach(ref => {
        scroll(animate(ref, {opacity: [0, 1, 1, 0], scale: [0.7, 1, 1, 1]}), {
          target: ref,
          offset: ['start end', 'end end', 'start start', 'end start'],
        });
      });
    }

    inView(analyticsCardRef, () => {
      setAnalyticsInView(true);
      return () => setAnalyticsInView(false);
    });
  });

  return (
    <div class={styles.main}>
      <div class={styles.container}>
        <div class={styles.twoSections}>
          <FeatureCard ref={el => (themeBuilderRef = el)}>
            <FeatureContent>
              <div class={`${styles.badge} ${styles.themeBuilderBadge}`}>
                <PaintBrush width={26} height={26} />
              </div>
              <div>
                <h2 style={{margin: 0, 'font-size': '3rem', 'font-weight': 700}}>
                  Theme builder
                </h2>
                <div style={{margin: '1rem 0'}}>
                  <div class={styles.comingSoonBadge}>Coming soon</div>
                </div>
                <div style={{'margin-top': '2rem'}}>
                  <p style={{margin: 0, 'font-size': '1.5rem', 'line-height': 1.5}}>
                    Create your own custom theme for CodeImage and CodeMirror,
                    then share it to everyone.
                  </p>
                </div>
              </div>
            </FeatureContent>
          </FeatureCard>

          <FeatureCard ref={el => (embedsRef = el)}>
            <FeatureContent>
              <div class={`${styles.badge} ${styles.embedsBadge}`}>
                <DocumentText width={26} height={26} />
              </div>
              <div>
                <h2 style={{margin: 0, 'font-size': '3rem', 'font-weight': 700}}>
                  Embeds
                </h2>
                <div style={{margin: '1rem 0'}}>
                  <div class={styles.comingSoonBadge}>Coming soon</div>
                </div>
                <div style={{'margin-top': '2rem'}}>
                  <p style={{margin: 0, 'font-size': '1.5rem', 'line-height': 1.5}}>
                    Embeds your snippets everywhere in a SEO-friendly way.
                  </p>
                </div>
              </div>
            </FeatureContent>
          </FeatureCard>
        </div>

        <div style={{'margin-top': '2rem'}}>
          <FeatureCard
            ref={el => (analyticsCardRef = el)}
            class={styles.analyticsFeatureCard}
          >
            <FeatureImageContent bgColor={'var(--root-purple)'}>
              <div class={styles.analyticsCardContainer}>
                <div class={styles.leftCardAnalytics}>
                  <AnalyticsCardBoxAnimation inView={analyticsInView()}>
                    <strong style={{'font-size': '1.125rem'}}>
                      Angular Change Detection
                    </strong>
                    <div style={{margin: '1rem 0'}}>
                      <span>Last week</span>
                    </div>
                    <MetricValue value={'1400'} />
                  </AnalyticsCardBoxAnimation>

                  <AnalyticsCardBoxAnimation inView={analyticsInView()}>
                    <strong style={{'font-size': '1.125rem'}}>
                      Solid Reactivity Example
                    </strong>
                    <div style={{margin: '1rem 0'}}>
                      <span>This month</span>
                    </div>
                    <MetricValue value={'10k'} />
                  </AnalyticsCardBoxAnimation>
                </div>

                <div class={styles.rightCardAnalytics}>
                  <AnalyticsCardBoxAnimation inView={analyticsInView()}>
                    <strong style={{'font-size': '1.125rem'}}>Rxjs operators</strong>
                    <div style={{margin: '1rem 0'}}>
                      <span>Last week</span>
                    </div>
                    <MetricValue value={'700'} />
                  </AnalyticsCardBoxAnimation>

                  <AnalyticsCardBoxAnimation inView={analyticsInView()}>
                    <strong style={{'font-size': '1.125rem'}}>Jest vs Jasmine</strong>
                    <div style={{margin: '1rem 0'}}>
                      <span>Today</span>
                    </div>
                    <MetricValue value={'0'} />
                  </AnalyticsCardBoxAnimation>
                </div>
              </div>
            </FeatureImageContent>

            <FeatureContent>
              <div class={`${styles.badge} ${styles.metricsBadge}`}>
                <ChartPie width={26} height={26} />
              </div>
              <div>
                <h2 style={{margin: 0, 'font-size': '3rem', 'font-weight': 700}}>
                  Measure the engagement
                </h2>
                <div style={{margin: '1rem 0'}}>
                  <div class={styles.comingSoonBadge}>Coming in 2023</div>
                </div>
                <div style={{'margin-top': '2rem'}}>
                  <p style={{margin: 0, 'font-size': '1.5rem', 'line-height': 1.5}}>
                    Analyze your snippets metrics to understand your followers.
                  </p>
                </div>
              </div>
            </FeatureContent>
          </FeatureCard>
        </div>
      </div>
    </div>
  );
}

function MetricValue(props: {value: string}) {
  return (
    <div
      style={{
        'margin-top': '2rem',
        display: 'flex',
        'align-items': 'baseline',
        gap: '0.5rem',
      }}
    >
      <strong style={{'font-size': '1.5rem', 'font-weight': 900}}>
        {props.value}
      </strong>
      <span style={{'font-size': '1.125rem'}}>views</span>
    </div>
  );
}

function AnalyticsCardBoxAnimation(props: FlowProps<{inView: boolean}>) {
  return (
    <Motion.div
      animate={{
        transform: props.inView
          ? 'translateY(0px) scale(1)'
          : 'translateY(40px) scale(0.7)',
        opacity: props.inView ? 1 : 0.4,
      }}
      class={styles.analyticsCard}
    >
      {props.children}
    </Motion.div>
  );
}
