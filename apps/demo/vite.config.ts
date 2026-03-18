import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const packages = path.resolve(__dirname, '../../packages');

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@reactcanvas/core': path.join(packages, 'core/src/index.ts'),
      '@reactcanvas/react': path.join(packages, 'react/src/index.ts'),
      '@reactcanvas/editor': path.join(packages, 'editor/src/index.ts'),
      '@reactcanvas/shapes': path.join(packages, 'shapes/src/index.ts'),
      '@reactcanvas/images': path.join(packages, 'images/src/index.ts'),
      '@reactcanvas/text': path.join(packages, 'text/src/index.ts'),
      '@reactcanvas/pages': path.join(packages, 'pages/src/index.ts'),
      '@reactcanvas/export': path.join(packages, 'export/src/index.ts'),
      '@reactcanvas/history': path.join(packages, 'history/src/index.ts'),
      '@reactcanvas/plugins': path.join(packages, 'plugins/src/index.ts'),
    },
    dedupe: ['react', 'react-dom', 'zustand', 'immer'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'zustand/vanilla',
      'zustand/traditional',
      'zustand/shallow',
      'zustand/middleware/immer',
      'immer',
      'nanoid',
      'use-sync-external-store/shim/with-selector.js',
    ],
  },
});
