import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import obsidianmd from 'eslint-plugin-obsidianmd';
import typescriptEslint from 'typescript-eslint';
import { sentenceCase } from './scripts/sentence-case.mjs';

export default defineConfig(
	globalIgnores([
		'coverage',
		'eslint.config.mjs',
		'esbuild.config.mjs',
		'main.js',
		'node_modules',
		'scripts',
		'version-bump.mjs',
	]),
	{
		languageOptions: {
			globals: {
				...globals.browser,
			},
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
	...typescriptEslint.configs.recommendedTypeChecked,
	...obsidianmd.configs.recommended,
	{
		files: ['src/**/*.ts', 'tests/**/*.ts'],
		rules: {
			'@typescript-eslint/consistent-type-imports': 'error',
			'@typescript-eslint/no-floating-promises': 'error',
			'@typescript-eslint/no-misused-promises': 'error',
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'curly': ['error', 'all'],
			'eqeqeq': ['error', 'always'],
			'obsidianmd/ui/sentence-case': ['error', sentenceCase],
		},
	},
);
