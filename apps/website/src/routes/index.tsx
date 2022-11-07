import {EditorFeature} from '~/components/Features/EditorFeature';
import {Features} from '~/components/Features/Features';
import {OpenSource} from '~/components/Features/OpenSource';
import {Footer} from '~/components/Footer/Footer';
import {Header} from '~/components/Header/Header';
import {MainPage} from '~/components/Main/MainPage';

export default function Home() {
  return (
    <main>
      <Header />
      <MainPage />
      <EditorFeature />
      <OpenSource />
      <Features />
      <Footer />
    </main>
  );
}
