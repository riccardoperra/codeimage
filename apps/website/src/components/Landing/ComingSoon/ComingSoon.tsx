import {Badge, Box, SvgIconProps, Text} from '@codeimage/ui';
import {Motion} from '@motionone/solid';
import {animate, inView, scroll} from 'motion';
import {createSignal, FlowProps, onMount} from 'solid-js';
import {
  FeatureCard,
  FeatureContent,
  FeatureImageContent,
} from '~/components/FeatureCard/FeatureCard';
import {injectBreakpoints} from '~/theme/breakpoints';
import {rootThemeVars} from '~/theme/theme.css';
import * as styles from './ComingSoon.css';

function PaintBrush(props: SvgIconProps) {
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

function ChartPie(props: SvgIconProps) {
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

function DocumentText(props: SvgIconProps) {
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
  let analyticsCardRef: HTMLDivElement;
  let themeBuilderRef: HTMLDivElement;
  let embedsRef: HTMLDivElement;
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
        <Box class={styles.twoSections}>
          <FeatureCard ref={themeBuilderRef}>
            <FeatureContent>
              <Badge theme={styles.themeBuilderBadge}>
                <PaintBrush width={26} height={26} />
              </Badge>
              <div>
                <Text size={'5xl'} weight={'bold'}>
                  Theme builder
                </Text>
                <Box marginY={4}>
                  <div class={styles.comingSoonBadge}>Coming soon</div>
                </Box>
                <Box marginTop={8}>
                  <Text size={'2xl'}>
                    <span>
                      Create your own custom theme for CodeImage and CodeMirror,
                      then share it to everyone.
                    </span>
                  </Text>
                </Box>
              </div>
            </FeatureContent>
          </FeatureCard>
          <FeatureCard ref={embedsRef}>
            <FeatureContent>
              <Badge theme={styles.embedsBadge}>
                <DocumentText width={26} height={26} />
              </Badge>
              <Box>
                <Text size={'5xl'} weight={'bold'}>
                  Embeds
                </Text>
                <Box marginY={4}>
                  <div class={styles.comingSoonBadge}>Coming soon</div>
                </Box>
                <Box marginTop={8}>
                  <Text size={'2xl'}>
                    <span>
                      Embeds your snippets everywhere in a SEO-friendly way.
                    </span>
                  </Text>
                </Box>
              </Box>
            </FeatureContent>
          </FeatureCard>
        </Box>
        <Box marginTop={8}>
          <FeatureCard
            ref={analyticsCardRef}
            class={styles.analyticsFeatureCard}
          >
            <FeatureImageContent bgColor={rootThemeVars.purple}>
              <div class={styles.analyticsCardContainer}>
                <div class={styles.leftCardAnalytics}>
                  <AnalyticsCardBoxAnimation inView={analyticsInView()}>
                    <Text size={'lg'} weight={'bold'}>
                      Angular Change Detection
                    </Text>
                    <Box marginY={4}>
                      <Text>Last week</Text>
                    </Box>
                    <Box marginTop={8}>
                      <Text size={'2xl'} weight={'black'}>
                        1400
                      </Text>
                      <Box as={Text} size={'lg'} marginLeft={2}>
                        views
                      </Box>
                    </Box>
                  </AnalyticsCardBoxAnimation>
                  <AnalyticsCardBoxAnimation inView={analyticsInView()}>
                    <Text size={'lg'} weight={'bold'}>
                      Solid Reactivity Example
                    </Text>
                    <Box marginY={4}>
                      <Text>This month</Text>
                    </Box>
                    <Box marginTop={8}>
                      <Text size={'2xl'} weight={'black'}>
                        10k
                      </Text>
                      <Box as={Text} size={'lg'} marginLeft={2}>
                        views
                      </Box>
                    </Box>
                  </AnalyticsCardBoxAnimation>
                </div>
                <div class={styles.rightCardAnalytics}>
                  <AnalyticsCardBoxAnimation inView={analyticsInView()}>
                    <Text size={'lg'} weight={'bold'}>
                      Rxjs operators
                    </Text>
                    <Box marginY={4}>
                      <Text>Last week</Text>
                    </Box>
                    <Box marginTop={8}>
                      <Text size={'2xl'} weight={'black'}>
                        700
                      </Text>
                      <Box as={Text} size={'lg'} marginLeft={2}>
                        views
                      </Box>
                    </Box>
                  </AnalyticsCardBoxAnimation>
                  <AnalyticsCardBoxAnimation inView={analyticsInView()}>
                    <Text size={'lg'} weight={'bold'}>
                      Jest vs Jasmine
                    </Text>
                    <Box marginY={4}>
                      <Text>Today</Text>
                    </Box>
                    <Box marginTop={8}>
                      <Text size={'2xl'} weight={'black'}>
                        0
                      </Text>
                      <Box as={Text} size={'lg'} marginLeft={2}>
                        views
                      </Box>
                    </Box>
                  </AnalyticsCardBoxAnimation>
                </div>
              </div>
            </FeatureImageContent>
            <FeatureContent>
              <Badge theme={styles.metricsBadge}>
                <ChartPie width={26} height={26} />
              </Badge>
              <Box>
                <Text size={'5xl'} weight={'bold'}>
                  Measure the engagement
                </Text>
                <Box marginY={4}>
                  <div class={styles.comingSoonBadge}>Coming in 2023</div>
                </Box>
                <Box marginTop={8}>
                  <Text size={'2xl'}>
                    <span>
                      Analyze your snippets metrics to understand your
                      followers.
                    </span>
                  </Text>
                </Box>
              </Box>
            </FeatureContent>
          </FeatureCard>
        </Box>
      </div>
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
