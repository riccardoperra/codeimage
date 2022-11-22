import {createResource} from 'solid-js';
import {Footer} from '~/components/Footer/Footer';
import {Header} from '~/components/Header/Header';
import {MainPage} from '~/components/Main/MainPage';
import {hydrateOnViewport} from '~/core/hydrateOnViewport';

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

const Projects = hydrateOnViewport(() =>
  import('../components/Landing/Projects/Projects').then(m => ({
    default: m.Projects,
  })),
);

const EditorSteps = hydrateOnViewport(() =>
  import('../components/Landing/EditorSteps/EditorSteps').then(m => ({
    default: m.EditorSteps,
  })),
);

const ComingSoon = hydrateOnViewport(
  () => import('../components/Landing/ComingSoon/ComingSoon'),
);

const OpenSource = hydrateOnViewport(() =>
  import('../components/Landing/OpenSource/OpenSource').then(m => ({
    default: m.OpenSource,
  })),
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
