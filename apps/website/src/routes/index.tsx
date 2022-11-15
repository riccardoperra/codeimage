import {ComingSoon} from '~/components/Features/ComingSoon';
import {EditorSteps} from '~/components/Landing/EditorSteps/EditorSteps';

import {OpenSource} from '~/components/Features/OpenSource';
import {Projects} from '~/components/Features/Projects';
import {Footer} from '~/components/Footer/Footer';
import {Header} from '~/components/Header/Header';
import {MainPage} from '~/components/Main/MainPage';

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
