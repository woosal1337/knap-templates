import { describe, expect, it } from 'vitest';
import {
	findDataDirective,
	parseTemplateData,
	safeFileName,
	suggestOutputFile,
	templateStem,
} from '../../src/core/data';

describe('template data', () => {
	it('parses one JSON object', () => {
		expect(parseTemplateData('{"title":"Machine","ports":[22,443]}')).toEqual({
			ports: [22, 443],
			title: 'Machine',
		});
	});

	it.each(['[]', 'null', '"text"', '42'])('rejects non-object JSON: %s', source => {
		expect(() => parseTemplateData(source)).toThrow('Use one JSON object');
	});

	it.each([
		'{# Knap input:examples/machine.json. Store references only. #}',
		'{# Knap input: examples/machine.json. Store references only. #}',
	])('returns the JSON path from a Knap comment: %s', template => {
		expect(findDataDirective(template)).toBe('examples/machine.json');
	});
});

describe('output names', () => {
	it.each([
		['machine.md', 'machine'],
		['machine.knap', 'machine'],
		['machine.knap.md', 'machine'],
	])('removes the template suffix from %s', (source, expected) => {
		expect(templateStem(source)).toBe(expected);
	});

	it('uses the title when the data supplies one', () => {
		expect(suggestOutputFile('machine.knap.md', { title: 'Hope / WSL' }))
			.toBe('Hope - WSL.md');
	});

	it('removes characters that are invalid in file names', () => {
		expect(safeFileName('  host:*?  ')).toBe('host---');
	});
});
