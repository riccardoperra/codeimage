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
  'editorSteps',
);

const Projects = createHydratable(
  () => import('../components/Landing/Projects/Projects'),
  'projects',
);

const ComingSoon = createHydratable(
  () => import('../components/Landing/ComingSoon/ComingSoon'),
  'comingSoon',
);

const OpenSource = createHydratable(
  () => import('../components/Landing/OpenSource/OpenSource'),
  'openSource',
);

const Showcase = createHydratable(
  () => import('../components/Landing/Showcase/Showcase'),
  'showcase',
);

const Footer = createHydratable(() => import('../components/Footer/Footer'));

export default function Home() {
  return (
    <main>
      <MainPage />
      <EditorSteps $hydration={{strategy: 'idle', timeout: 200}} />
      <Projects
        $hydration={{
          strategy: 'visible',
          afterIntersectedElementId: EditorSteps.sectionId,
        }}
      />
      <ComingSoon
        $hydration={{
          strategy: 'visible',
          afterIntersectedElementId: EditorSteps.sectionId,
        }}
      />
      <Showcase
        $hydration={{
          strategy: 'visible',
          afterIntersectedElementId: Projects.sectionId,
        }}
      />
      <OpenSource
        $hydration={{
          strategy: 'visible',
          afterIntersectedElementId: ComingSoon.sectionId,
        }}
      />
      <Footer
        $hydration={{
          strategy: 'visible',
          afterIntersectedElementId: ComingSoon.sectionId,
        }}
      />
    </main>
  );
}
