import {createI18nContext, I18nContext} from '@codeimage/locale';
import {CodeImageThemeProvider} from '@codeimage/ui';
import '../assets/styles/app.scss';
import App from '../components/App';
import {locale} from '../i18n';

const theme: Parameters<typeof CodeImageThemeProvider>[0]['theme'] = {
  text: {
    weight: 'medium',
  },
};

export default function Home() {
  const i18n = createI18nContext(locale);

  return (
    <main>
      <I18nContext.Provider value={i18n}>
        <CodeImageThemeProvider theme={theme}>
          <App />
        </CodeImageThemeProvider>
      </I18nContext.Provider>
    </main>
  );
}
