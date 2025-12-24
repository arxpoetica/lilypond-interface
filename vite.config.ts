import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type ViteUserConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import { sveltekit } from '@sveltejs/kit/vite';
import pkg from './package.json';
import mkcert from 'vite-plugin-mkcert';

const { PORT = '9876', DEV_USE_HTTPS } = process.env;

const config: ViteUserConfig = {
	clearScreen: false,
	plugins: [tailwindcss(), sveltekit()],
	server: { port: parseInt(PORT) },
	define: { __VERSION__: JSON.stringify(pkg.version) },
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }],
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
				},
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
				},
			},
		],
	},
};

if (DEV_USE_HTTPS === 'true' && config.server && config.plugins) {
	config.server.host = true;
	config.server.https = {};
	config.plugins.push(mkcert({ autoUpgrade: true, savePath: './certs' }));
}

export default defineConfig(config);
