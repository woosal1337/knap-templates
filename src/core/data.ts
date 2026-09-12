import type { TemplateVariables } from 'knap';

const DATA_DIRECTIVE = /\binput:([^\s#]+?\.json)\b/iu;
const INVALID_FILE_NAME = '\\/:*?"<>|';

export class TemplateDataError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'TemplateDataError';
	}
}

export function parseTemplateData(source: string): TemplateVariables {
	let value: unknown;

	try {
		value = JSON.parse(source);
	}
	catch (error) {
		const detail = error instanceof Error ? error.message : 'Unknown JSON error.';
		throw new TemplateDataError(`Use one valid JSON object. ${detail}`);
	}

	if (value === null || Array.isArray(value) || typeof value !== 'object') {
		throw new TemplateDataError('Use one JSON object. Arrays and scalar values are not supported.');
	}

	return value as TemplateVariables;
}

export function findDataDirective(template: string): string | null {
	return DATA_DIRECTIVE.exec(template)?.[1] ?? null;
}

export function templateStem(fileName: string): string {
	return fileName
		.replace(/\.knap\.md$/iu, '')
		.replace(/\.(?:knap|md)$/iu, '');
}

export function safeFileName(value: string): string {
	const safe = Array.from(value, character => {
		const codePoint = character.codePointAt(0) ?? 0;
		return codePoint <= 0x1F || INVALID_FILE_NAME.includes(character) ? '-' : character;
	}).join('')
		.replace(/\s+/gu, ' ')
		.replace(/^[ .]+|[ .]+$/gu, '')
		.trim();

	return safe || 'Untitled';
}

export function suggestOutputFile(
	templateName: string,
	variables: TemplateVariables,
): string {
	const title = typeof variables.title === 'string' ? variables.title.trim() : '';
	return `${safeFileName(title || templateStem(templateName))}.md`;
}
