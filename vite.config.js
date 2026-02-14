import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const USE_MOCK = env.VITE_USE_MOCK_DATA === 'true';

  console.log('[Vite Config] Mode:', mode);
  console.log('[Vite Config] USE_MOCK:', USE_MOCK);

  const plugins = [react()];

  // Only add Base44 plugin if not in mock mode
  if (!USE_MOCK) {
    console.log('[Vite Config] Adding Base44 plugin');
    plugins.unshift(base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      visualEditAgent: true
    }));
  } else {
    console.log('[Vite Config] Skipping Base44 plugin (mock mode)');
  }

  return {
    plugins,
    server: {
      port: 5173,
      strictPort: false,
      open: false,
      host: true
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    clearScreen: false
  };
});