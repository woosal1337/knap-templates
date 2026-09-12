import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			exclude: ['src/main.ts', 'src/settings.ts', 'src/services/**', 'src/ui/**'],
			provider: 'v8',
		},
		environment: 'node',
		include: ['tests/**/*.test.ts'],
	},
});
