/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PUBLIC_AUTH0_DOMAIN: string;
  readonly VITE_PUBLIC_AUTH0_CLIENT_ID: string;
  readonly VITE_PUBLIC_MY_CALLBACK_URL: string;
  readonly VITE_PUBLIC_AUTH0_AUDIENCE: string;
  readonly VITE_ENABLE_MSW: boolean;
  readonly VITE_MOCK_AUTH: boolean;
  readonly VITE_API_BASE_URL: string | null;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
