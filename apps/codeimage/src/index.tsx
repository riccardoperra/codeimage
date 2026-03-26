import { createI18nContext, I18nContext, useI18n } from "@codeimage/locale";
import { getAuth0State } from "@codeimage/store/auth/auth0";
import { getRootEditorStore } from "@codeimage/store/editor";
import { EditorConfigStore } from "@codeimage/store/editor/config.store";
import { getThemeStore } from "@codeimage/store/theme/theme.store";
import { getUiStore } from "@codeimage/store/ui";
import { VersionStore } from "@codeimage/store/version/version.store";
import type { ThemeProviderProps } from "@codeimage/ui";
import { backgroundColorVar, CodeImageThemeProvider, SnackbarHost } from "@codeimage/ui";
import "@codeimage/ui/themes/lightTheme";
import { appEnvironment } from "@core/configuration";
import { Router, Navigate, type RouteDefinition } from "@solidjs/router";
import { snackbarHostAppStyleCss } from "@ui/snackbarHostAppStyle.css";
import { setElementVars } from "@vanilla-extract/dynamic";
import type { Component } from "solid-js";
import { createEffect, lazy, on, Show, Suspense } from "solid-js";
import { render } from "solid-js/web";
import { provideState, StateProvider } from "statebuilder";
import "./assets/styles/app.scss";
import { SidebarPopoverHost } from "./components/PropertyEditor/SidebarPopoverHost";
import { Scaffold } from "./components/Scaffold/Scaffold";
import { locale } from "./i18n";
import { EditorPageSkeleton } from "./pages/Editor/components/EditorSkeleton";
import "./theme/global.css";

console.debug("💻 CodeImage version:", appEnvironment.version);

const i18n = createI18nContext(locale);

if (import.meta.env.VITE_ENABLE_MSW === true) {
  import("./mocks/browser").then(({ worker }) => worker.start());
}

// oxlint-disable-next-line typescript/no-explicit-any
function lazyWithNoLauncher(cp: () => Promise<{ default: Component<any> }>) {
  return lazy(() => {
    queueMicrotask(() => {
      document.querySelector("#launcher")?.remove();
    });
    return cp();
  });
}

const tokens: ThemeProviderProps["tokens"] = {
  text: {
    weight: "medium",
  },
};

const Dashboard = lazyWithNoLauncher(() => import("./pages/Dashboard/Dashboard"));

const Editor = () => {
  const Page = lazyWithNoLauncher(() => import("./pages/Editor/Editor"));
  getThemeStore().loadThemes();

  const editorConfig = provideState(EditorConfigStore);
  const versionState = provideState(VersionStore);

  return (
    <Suspense fallback={<EditorPageSkeleton />}>
      <Show fallback={<EditorPageSkeleton />} when={editorConfig.get.ready && versionState.ready()}>
        <Page />
      </Show>
    </Suspense>
  );
};

const NotFoundPage = lazyWithNoLauncher(() => import("./pages/NotFound/NotFoundPage"));

export function Bootstrap() {
  getRootEditorStore();
  const [, { locale }] = useI18n();
  const uiStore = getUiStore();
  const auth0 = getAuth0State();
  createEffect(on(() => uiStore.get.locale, locale));
  const mode = () => uiStore.currentTheme();

  const routes: RouteDefinition<string>[] = [
    {
      path: "",
      component: () => {
        const state = getAuth0State();
        return (
          <Show fallback={<Editor />} when={state.loggedIn()}>
            <Dashboard />
          </Show>
        );
      },
    },
    {
      path: ":snippetId",
      component: Editor,
    },
    {
      path: "404",
      component: NotFoundPage,
    },
    {
      path: "dashboard",
      component: () => <Navigate href="/" />,
    },
    {
      path: "login",
      component: () => {
        if (auth0.loggedIn()) {
          return <Navigate href={"/"} />;
        } else {
          auth0.login();
        }
      },
    },
    {
      path: "/*all",
      component: () => <Navigate href="/404" />,
    },
  ];

  createEffect(
    on(mode, (theme) => {
      const scheme = document.querySelector('meta[name="theme-color"]');
      const color = theme === "dark" ? "#151516" : "#FFFFFF";
      if (scheme) {
        scheme.setAttribute("content", color);
      }
      setElementVars(document.documentElement, {
        [backgroundColorVar]: color,
      });
      document.documentElement.setAttribute("data-cui-theme", theme as string);
    }),
  );

  return (
    <Scaffold>
      <CodeImageThemeProvider tokens={tokens} theme={mode()}>
        <SnackbarHost containerClassName={snackbarHostAppStyleCss} />
        <Router>{routes}</Router>
      </CodeImageThemeProvider>
      <SidebarPopoverHost />
    </Scaffold>
  );
}

getAuth0State()
  .initLogin()
  .catch(() => null)
  .then(() => {
    render(
      () => (
        <I18nContext.Provider value={i18n}>
          <StateProvider>
            <Bootstrap />
          </StateProvider>
        </I18nContext.Provider>
      ),
      document.getElementById("root") as HTMLElement,
    );
  });
