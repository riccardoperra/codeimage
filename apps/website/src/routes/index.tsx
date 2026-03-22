import {createFileRoute} from '@tanstack/solid-router';
import {lazy} from 'solid-js';
import MainPage from '~/components/Main/MainPage';
import {
  ogImageUrl,
  websiteDescription,
  websiteTitle,
  websiteUrl,
} from '~/core/constants';
import {breakpoints} from '~/theme/breakpoints';
import {loadMainData} from '../components/Main/MainData.tsx';

const EditorSteps = lazy(
  () => import('../components/Landing/EditorSteps/EditorSteps'),
);

const OpenSource = lazy(
  () => import('../components/Landing/OpenSource/OpenSource'),
);

const Showcase = lazy(() => import('../components/Landing/Showcase/Showcase'));

const Footer = lazy(() => import('../components/Footer/Footer'));

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      {title: websiteTitle},
      {name: 'title', content: 'CodeImage'},
      {name: 'description', content: websiteDescription},
      {property: 'og:type', content: 'website'},
      {property: 'og:url', content: websiteUrl},
      {property: 'og:title', content: websiteTitle},
      {property: 'og:description', content: websiteDescription},
      {property: 'og:image', content: ogImageUrl},
      {name: 'twitter:card', content: 'summary_large_image'},
      {property: 'twitter:url', content: websiteUrl},
      {property: 'twitter:title', content: websiteTitle},
      {property: 'twitter:description', content: websiteDescription},
      {property: 'twitter:image', content: ogImageUrl},
    ],
    links: [
      {rel: 'canonical', href: websiteUrl},
      {
        rel: 'preload',
        href: '/landing/codeimage_preview_mobile.webp',
        as: 'image',
        media: `(min-width: ${breakpoints.tablet}px) and (max-width: ${
          breakpoints.desktop - 1
        }px)`,
      },
      {
        rel: 'preload',
        href: '/landing/codeimage_preview_desktop.webp',
        as: 'image',
        media: `(min-width: ${breakpoints.desktop}px)`,
      },
    ],
  }),
  loader: () => loadMainData(),
  component: Home,
});

export default function Home() {
  const data = Route.useLoaderData();

  return (
    <main>
      <MainPage data={data()} />
      <EditorSteps />
      <Showcase />
      <OpenSource />
      <Footer />
    </main>
  );
}
