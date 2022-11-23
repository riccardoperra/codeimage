import { createResource, lazy } from 'solid-js';
import { hydrateOnViewport } from '~/core/hydrateOnViewport';
import { Header } from '~/components/Header/Header';
import { MainPage } from '~/components/Main/MainPage';

function getRepoInfo() {
  return fetch('https://ungh.unjs.io/repos/riccardoperra/codeimage')
    .then(res => res.json())
    .then(res => res.repo);
}

export function routeData() {
  const [data] = createResource(getRepoInfo);
  return {
    repoInfo: data(),
  };
}

const EditorSteps = hydrateOnViewport(
  () => import('../components/Landing/EditorSteps/EditorSteps'),
  'visible',
);

const Projects = hydrateOnViewport(
  () => import('../components/Landing/Projects/Projects'),
  'visible',
);

const ComingSoon = hydrateOnViewport(
  () => import('../components/Landing/ComingSoon/ComingSoon'),
  'visible',
);

const OpenSource = hydrateOnViewport(
  () => import('../components/Landing/OpenSource/OpenSource'),
  'visible',
);

const Footer = hydrateOnViewport(
  () => import('../components/Footer/Footer'),
  'visible',
);

export default function Home() {
  return (
    <main>
      <Header />
      <MainPage />
      <EditorSteps />
      <Projects />
      <ComingSoon />
      <OpenSource />
      <Footer />
    </main>
  );
}
