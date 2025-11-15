/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

interface ImportMetaEnv {
  readonly VITE_API_BASE: string; // http://127.0.0.1:8000/api
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;           // p.ej. http://127.0.0.1:8000/api
  readonly VITE_FRONTEND_URL?: string;      // p.ej. http://localhost:5173
  readonly VITE_TOKEN_STORAGE_KEY?: string; // p.ej. kikirutas_token
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
