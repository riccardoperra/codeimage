import {ComingSoon} from '~/components/Landing/ComingSoon/ComingSoon';
import {EditorSteps} from '~/components/Landing/EditorSteps/EditorSteps';
import {OpenSource} from '~/components/Landing/OpenSource/OpenSource';
import {Projects} from '~/components/Landing/Projects/Projects';
import {Footer} from '~/components/Footer/Footer';
import {Header} from '~/components/Header/Header';
import {MainPage} from '~/components/Main/MainPage';
import {createResource} from 'solid-js';

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
