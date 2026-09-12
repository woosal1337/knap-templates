export class OutputPathError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'OutputPathError';
	}
}

export function joinVaultPath(...parts: string[]): string {
	return parts
		.map(part => part.trim().replace(/^\/+|\/+$/gu, ''))
		.filter(Boolean)
		.join('/');
}

export function prepareOutputPath(value: string, defaultFolder: string): string {
	const trimmed = value.trim();
	if (!trimmed) {
		throw new OutputPathError('Enter a file path for the rendered note.');
	}

	const slashNormalized = trimmed.replace(/\\/gu, '/');
	const segments = slashNormalized.split('/');
	if (slashNormalized.startsWith('/') || segments.includes('..')) {
		throw new OutputPathError('Use a path inside the vault.');
	}

	const withExtension = slashNormalized.toLowerCase().endsWith('.md')
		? slashNormalized
		: `${slashNormalized}.md`;

	return withExtension.includes('/')
		? joinVaultPath(withExtension)
		: joinVaultPath(defaultFolder, withExtension);
}

export function numberedPath(path: string, number: number): string {
	const match = /^(.*?)(\.md)$/iu.exec(path);
	if (!match) {
		return `${path} ${number}`;
	}

	return `${match[1]} ${number}${match[2]}`;
}
