import {createRouteData} from 'solid-start';
import MainPage from '~/components/Main/MainPage';
import {createHydratable} from '~/core/hydration/createHydratable';

export function routeData() {
  return createRouteData(
    async () => {
      const result = await fetch(
        'https://ungh.unjs.io/repos/riccardoperra/codeimage',
      )
        .then(res => res.json())
        .then(res => res.repo)
        .catch(() => ({stars: '?'}));

      return {
        repo: result,
      };
    },
    {key: ['repoInfo']},
  );
}

const EditorSteps = createHydratable(
  () => import('../components/Landing/EditorSteps/EditorSteps'),
);

const Projects = createHydratable(
  () => import('../components/Landing/Projects/Projects'),
);

const ComingSoon = createHydratable(
  () => import('../components/Landing/ComingSoon/ComingSoon'),
);

const OpenSource = createHydratable(
  () => import('../components/Landing/OpenSource/OpenSource'),
);

const Showcase = createHydratable(
  () => import('../components/Landing/Showcase/Showcase'),
);

const Footer = createHydratable(() => import('../components/Footer/Footer'));

export default function Home() {
  return (
    <main>
      <MainPage />
      <EditorSteps
        $hydration={{
          strategy: 'idle',
          timeout: 200,
        }}
        test={5}
      />
      <Projects
        $hydration={{
          strategy: 'visible',
          init: {
            rootMargin: '500px',
          },
        }}
      />
      <ComingSoon
        $hydration={{
          strategy: 'visible',
          init: {
            rootMargin: '500px',
          },
        }}
      />
      <OpenSource
        $hydration={{
          strategy: 'visible',
          init: {
            rootMargin: '1000px',
          },
        }}
      />
      <Showcase
        $hydration={{
          strategy: 'visible',
          init: {
            rootMargin: '500px',
          },
        }}
      />
      <Footer
        $hydration={{
          strategy: 'visible',
        }}
      />
    </main>
  );
}
