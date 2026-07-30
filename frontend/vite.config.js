import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'));

const ontoyPlugin = () => ({
    name: 'sieej-ontoy',
    apply: 'build',
    generateBundle() {
        this.emitFile({
            type: 'asset',
            fileName: 'ontoy.json',
            source: `${JSON.stringify({
                version: pkg.version,
                service: 'sieej',
                released_at: new Date().toISOString().slice(0, 10),
                status: 'ok',
            })}\n`,
        });
    },
});

export default defineConfig(({ mode }) => {
    const { resolve } = path;
    const env = loadEnv(mode, process.cwd(), '');
    const PORT = Number(env.VITE_PORT ?? '5174');
    const HOST_FRONTEND = env.VITE_HOST_FRONTEND ?? '0.0.0.0';
    const BASE_PATH = env.VITE_BASE_PATH ?? '/';

    return {
        base: BASE_PATH,
        define: {
            __APP_VERSION__: JSON.stringify(pkg.version),
            global: 'globalThis',
        },
        plugins: [react(), tailwindcss(), ontoyPlugin()],
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: ['./test/setup.js'],
            css: false,
        },
        build: {
            rolldownOptions: {
                output: {
                    codeSplitting: {
                        groups: [
                            {
                                name: 'vendor-react',
                                test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                                priority: 30,
                            },
                            {
                                name: 'vendor-router',
                                test: /node_modules[\\/]react-router/,
                                priority: 20,
                            },
                            {
                                name: 'vendor-form',
                                test: /node_modules[\\/]react-hook-form[\\/]/,
                                priority: 10,
                            },
                        ],
                    },
                },
            },
        },
        server: {
            host: HOST_FRONTEND,
            port: PORT,
            proxy: {
                ...(env.BACKEND_DEV_TARGET && {
                    '/api': {
                        target: env.BACKEND_DEV_TARGET,
                        changeOrigin: true,
                    }
                }),
                ...(env.MARIACHI_DEV_TARGET && {
                    '/api/public': {
                        target: env.MARIACHI_DEV_TARGET,
                        changeOrigin: true,
                    },
                    '/colibri': {
                        target: env.MARIACHI_DEV_TARGET,
                        changeOrigin: true,
                    }
                }),
            },
        },
        resolve: {
            alias: {
                '@components': resolve(__dirname, './src/components'),
                '@layout': resolve(__dirname, './src/layout'),
                '@pages': resolve(__dirname, './src/pages'),
                '@context': resolve(__dirname, './src/context'),
                '@helpers': resolve(__dirname, './src/helpers'),
                '@services': resolve(__dirname, './src/services'),
                '@forms': resolve(__dirname, './src/forms'),
                '@assets': resolve(__dirname, './src/assets'),
                '@icons': resolve(__dirname, './src/assets/icons'),
                '@svg': resolve(__dirname, './src/assets/svg'),
                buffer: 'buffer/',
            },
        },
    };
});
