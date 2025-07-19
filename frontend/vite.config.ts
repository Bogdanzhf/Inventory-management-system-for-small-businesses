import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Добавляем опции для более стабильной работы React
      jsxRuntime: 'automatic',
      babel: {
        plugins: ['@babel/plugin-transform-react-jsx'],
      },
    }), 
    tsconfigPaths(),
    svgr()
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    strictPort: false, // Разрешаем использование другого порта, если 3000 занят
    host: true, // Слушаем на всех интерфейсах
    open: true, // Автоматически открывать в браузере
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // Прямой адрес бэкенда
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path, // Сохраняем полный путь с префиксом /api
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Ошибка прокси:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Логирование исходного URL и конечного URL
            console.log(`Отправка запроса: ${req.method} ${req.url} -> ${proxyReq.path}`);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log(`Получен ответ: ${proxyRes.statusCode} для ${req.url}`);
          });
        },
      }
    },
    hmr: {
      overlay: false // Отключаем оверлей ошибок HMR
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Импорты SCSS переехали в соответствующие файлы
      }
    }
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material'],
  },
}); 