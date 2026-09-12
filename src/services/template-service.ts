import {
	normalizePath,
	TFile,
	TFolder,
	type App,
} from 'obsidian';
import { numberedPath, prepareOutputPath } from '../core/path';

const TEMPLATE_EXTENSIONS = new Set(['knap', 'md']);

function hasParentSegment(path: string): boolean {
	return path.replace(/\\/gu, '/').split('/').includes('..');
}

export class TemplateService {
	constructor(private readonly app: App) {}

	listTemplates(folders: readonly string[]): TFile[] {
		const templates = new Map<string, TFile>();

		for (const folderPath of folders) {
			const folder = this.getFolder(folderPath);
			if (!folder) {
				continue;
			}

			for (const file of this.filesIn(folder)) {
				if (this.isTemplateFile(file)) {
					templates.set(file.path, file);
				}
			}
		}

		return [...templates.values()].sort((left, right) =>
			left.path.localeCompare(right.path));
	}

	isTemplateFile(file: TFile): boolean {
		return TEMPLATE_EXTENSIONS.has(file.extension.toLowerCase())
			&& file.basename.toLowerCase() !== 'readme';
	}

	isInTemplateFolder(file: TFile, folders: readonly string[]): boolean {
		return folders.some(folder => {
			const normalized = this.normalizedFolder(folder);
			return normalized === '' || file.path.startsWith(`${normalized}/`);
		});
	}

	async read(file: TFile): Promise<string> {
		return await this.app.vault.cachedRead(file);
	}

	resolveDataFile(template: TFile, requestedPath: string): TFile | null {
		if (!requestedPath.trim() || hasParentSegment(requestedPath)) {
			return null;
		}

		const requested = normalizePath(requestedPath.trim().replace(/^\/+/, ''));
		const parentPath = template.parent?.path ?? '';
		const relativePath = normalizePath([parentPath, requested].filter(Boolean).join('/'));
		const candidates = [...new Set([relativePath, requested])];

		for (const candidate of candidates) {
			const file = this.app.vault.getAbstractFileByPath(candidate);
			if (file instanceof TFile && file.extension.toLowerCase() === 'json') {
				return file;
			}
		}

		return null;
	}

	async createNote(
		requestedPath: string,
		defaultFolder: string,
		content: string,
	): Promise<TFile> {
		const prepared = normalizePath(prepareOutputPath(requestedPath, defaultFolder));
		const uniquePath = this.uniquePath(prepared);
		await this.createParentFolders(uniquePath);
		return await this.app.vault.create(uniquePath, content);
	}

	private getFolder(path: string): TFolder | null {
		const normalized = this.normalizedFolder(path);
		if (normalized === '') {
			return this.app.vault.getRoot();
		}

		const abstractFile = this.app.vault.getAbstractFileByPath(normalized);
		return abstractFile instanceof TFolder ? abstractFile : null;
	}

	private normalizedFolder(path: string): string {
		if (hasParentSegment(path)) {
			return '__invalid__';
		}
		return normalizePath(path.trim().replace(/^\/+|\/+$/gu, ''));
	}

	private filesIn(folder: TFolder): TFile[] {
		const files: TFile[] = [];

		for (const child of folder.children) {
			if (child instanceof TFile) {
				files.push(child);
			}
			else if (child instanceof TFolder) {
				files.push(...this.filesIn(child));
			}
		}

		return files;
	}

	private uniquePath(path: string): string {
		if (!this.app.vault.getAbstractFileByPath(path)) {
			return path;
		}

		for (let number = 2; number < 10_000; number += 1) {
			const candidate = numberedPath(path, number);
			if (!this.app.vault.getAbstractFileByPath(candidate)) {
				return candidate;
			}
		}

		throw new Error('Unable to find an unused output file name. Choose a different name.');
	}

	private async createParentFolders(path: string): Promise<void> {
		const segments = path.split('/').slice(0, -1);
		let current = '';

		for (const segment of segments) {
			current = current ? `${current}/${segment}` : segment;
			const abstractFile = this.app.vault.getAbstractFileByPath(current);

			if (abstractFile instanceof TFile) {
				throw new Error(`The output folder conflicts with the file ${current}. Choose a different folder.`);
			}
			if (!abstractFile) {
				await this.app.vault.createFolder(current);
			}
		}
	}
}
