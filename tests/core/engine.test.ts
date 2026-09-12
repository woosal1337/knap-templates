import { describe, expect, it } from 'vitest';
import { renderKnapTemplate, validateKnapTemplate } from '../../src/core/engine';

describe('Knap engine', () => {
	it('renders structured data into Markdown', async () => {
		const result = await renderKnapTemplate(
			'# {{ title }}\n\n{{ services | table_pretty }}',
			{
				services: [
					{ host: 'hope-wsl', port: 22 },
					{ host: 'igris', port: 443 },
				],
				title: 'Lab',
			},
		);

		expect(result.errors).toEqual([]);
		expect(result.output).toContain('# Lab');
		expect(result.output).toContain('hope-wsl');
		expect(result.output).toContain('igris');
	});

	it('reports invalid template syntax with a source location', () => {
		const errors = validateKnapTemplate('{% if title %}missing end');

		expect(errors).toHaveLength(1);
		expect(errors[0]).toMatchObject({
			code: 'PARSE_ERROR',
			line: 1,
		});
	});

	it('disables regular-expression searches by default', async () => {
		const result = await renderKnapTemplate(
			'{{ title | replace:"/a/g":"b" }}',
			{ title: 'a' },
		);

		expect(result.errors.length).toBeGreaterThan(0);
	});
});
