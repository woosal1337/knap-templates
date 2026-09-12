import { describe, expect, it } from 'vitest';
import { joinVaultPath, numberedPath, prepareOutputPath } from '../../src/core/path';

describe('vault paths', () => {
	it('joins vault path segments without duplicate separators', () => {
		expect(joinVaultPath('/projects/', '/lab/', 'host.md')).toBe('projects/lab/host.md');
	});

	it('adds the default folder and Markdown extension', () => {
		expect(prepareOutputPath('Hope', 'lab/machines')).toBe('lab/machines/Hope.md');
	});

	it('keeps an explicit vault-relative folder', () => {
		expect(prepareOutputPath('projects/work/app.md', 'lab')).toBe('projects/work/app.md');
	});

	it.each(['/outside.md', '../outside.md', 'lab/../../outside.md'])(
		'rejects a path outside the vault: %s',
		path => {
			expect(() => prepareOutputPath(path, '')).toThrow('inside the vault');
		},
	);

	it('adds a number before the Markdown extension', () => {
		expect(numberedPath('lab/Hope.md', 2)).toBe('lab/Hope 2.md');
	});
});
