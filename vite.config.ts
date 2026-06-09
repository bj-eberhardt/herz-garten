import { existsSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [
    {
      name: 'legacy-source-extension-rewrite',
      configureServer(server) {
        server.middlewares.use((request, _response, next) => {
          if (!request.url?.startsWith('/src/')) {
            next();
            return;
          }

          const parsedUrl = new URL(request.url, 'http://localhost');
          const pathname = parsedUrl.pathname;
          const candidatePath = pathname.endsWith('.vue.js')
            ? pathname.slice(0, -3)
            : pathname.endsWith('.js')
              ? `${pathname.slice(0, -3)}.ts`
              : '';

          if (!candidatePath) {
            next();
            return;
          }

          const localPath = fileURLToPath(new URL(`.${candidatePath}`, import.meta.url));
          if (existsSync(localPath)) {
            request.url = `${candidatePath}${parsedUrl.search}`;
          }

          next();
        });
      },
    },
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
