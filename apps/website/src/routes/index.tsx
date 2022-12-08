import {createRouteData} from 'solid-start';
import {hydrateOnViewport} from '~/core/hydrateOnViewport';

export function routeData() {
  return createRouteData(
    async () => {
      const result = await fetch(
        'https://ungh.unjs.io/repos/riccardoperra/codeimage',
      )
        .then(res => res.json())
        .then(res => res.repo);

      return {
        repo: result,
      };
    },
    {key: ['repoInfo']},
  );
}

const MainPage = hydrateOnViewport(
  () => import('../components/Main/MainPage'),
  'idle',
);

const EditorSteps = hydrateOnViewport(
  () => import('../components/Landing/EditorSteps/EditorSteps'),
  'idle',
);

const Projects = hydrateOnViewport(
  () => import('../components/Landing/Projects/Projects'),
  'visible',
  {
    rootMargin: '500px',
  },
);

const ComingSoon = hydrateOnViewport(
  () => import('../components/Landing/ComingSoon/ComingSoon'),
  'visible',
  {
    rootMargin: '500px',
  },
);

const OpenSource = hydrateOnViewport(
  () => import('../components/Landing/OpenSource/OpenSource'),
  'visible',
  {
    rootMargin: '500px',
  },
);

const Showcase = hydrateOnViewport(
  () => import('../components/Landing/Showcase/Showcase'),
  'visible',
  {
    rootMargin: '500px',
  },
);

const Footer = hydrateOnViewport(
  () => import('../components/Footer/Footer'),
  'visible',
);

export default function Home() {
  return (
    <main>
      <MainPage />
      <EditorSteps />
      <Projects />
      <ComingSoon />
      <OpenSource />
      <Showcase />
      <Footer />
    </main>
  );
}
