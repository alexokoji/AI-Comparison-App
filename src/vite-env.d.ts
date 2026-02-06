/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEM0_API_KEY: string
  readonly VITE_MEM0_API_URL: string
  readonly VITE_ZEP_API_KEY: string
  readonly VITE_ZEP_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
