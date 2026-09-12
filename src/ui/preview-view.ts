import {
	FileView,
	MarkdownRenderChild,
	MarkdownRenderer,
	Notice,
	type TFile,
	type WorkspaceLeaf,
} from 'obsidian';
import { findDataDirective, parseTemplateData } from '../core/data';
import {
	formatTemplateError,
	formatTemplateWarning,
	renderKnapTemplate,
} from '../core/engine';
import type { TemplateService } from '../services/template-service';

export const KNAP_PREVIEW_VIEW_TYPE = 'knap-template-preview';

interface KnapPreviewViewOptions {
	allowRegex: () => boolean;
	createNote: (file: TFile) => void;
	editSource: (leaf: WorkspaceLeaf, file: TFile) => void;
	service: TemplateService;
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'An unknown error stopped the preview.';
}

export class KnapTemplatePreviewView extends FileView {
	private dataFilePath: string | null = null;
	private inlineTitleEl: HTMLDivElement | null = null;
	private previewChild: MarkdownRenderChild | null = null;
	private previewEl: HTMLDivElement | null = null;
	private revision = 0;
	private statusEl: HTMLDivElement | null = null;

	constructor(leaf: WorkspaceLeaf, private readonly options: KnapPreviewViewOptions) {
		super(leaf);
		this.navigation = true;

		this.addAction('pencil', 'Edit source', () => {
			if (this.file) {
				this.options.editSource(this.leaf, this.file);
			}
		});
		this.addAction('file-output', 'Create note from template', () => {
			if (this.file) {
				this.options.createNote(this.file);
			}
		});
		this.addAction('refresh-cw', 'Refresh Knap preview', () => {
			if (this.file) {
				void this.renderFile(this.file);
			}
		});
	}

	override getViewType(): string {
		return KNAP_PREVIEW_VIEW_TYPE;
	}

	override getDisplayText(): string {
		return this.file ? `${this.file.basename} · Knap preview` : 'Knap preview';
	}

	override getIcon(): string {
		return 'file-output';
	}

	protected override async onOpen(): Promise<void> {
		this.buildShell();
		this.registerEvent(this.app.vault.on('modify', file => {
			if ((file.path === this.file?.path || file.path === this.dataFilePath) && this.file) {
				void this.renderFile(this.file);
			}
		}));
		if (this.file) {
			await this.renderFile(this.file);
		}
	}

	protected override async onClose(): Promise<void> {
		this.revision += 1;
		this.previewChild?.unload();
		this.previewChild = null;
		this.dataFilePath = null;
		this.contentEl.empty();
	}

	override async onLoadFile(file: TFile): Promise<void> {
		await this.renderFile(file);
	}

	override async onUnloadFile(_file: TFile): Promise<void> {
		this.revision += 1;
		this.previewChild?.unload();
		this.previewChild = null;
		this.previewEl?.empty();
	}

	private buildShell(): void {
		if (this.inlineTitleEl && this.previewEl && this.statusEl) {
			return;
		}

		this.contentEl.empty();
		this.contentEl.addClass('knap-preview-view', 'markdown-reading-view');
		const scrollEl = this.contentEl.createDiv({
			cls: 'knap-preview-view-scroll markdown-preview-view is-readable-line-width',
		});
		const sizerEl = scrollEl.createDiv({ cls: 'knap-preview-view-sizer markdown-preview-sizer' });
		this.inlineTitleEl = sizerEl.createDiv({ cls: 'inline-title' });
		const headerEl = sizerEl.createDiv({ cls: 'knap-preview-view-header' });
		headerEl.createSpan({ cls: 'knap-preview-view-label', text: 'Knap preview' });
		this.statusEl = headerEl.createDiv({
			attr: { 'aria-live': 'polite', role: 'status' },
			cls: 'knap-preview-view-status',
		});
		this.previewEl = sizerEl.createDiv({ cls: 'knap-preview-view-content markdown-rendered' });
	}

	private async renderFile(file: TFile): Promise<void> {
		this.buildShell();
		const revision = ++this.revision;
		const previewEl = this.previewEl!;
		const statusEl = this.statusEl!;
		this.inlineTitleEl!.setText(file.basename);
		this.dataFilePath = null;
		previewEl.setAttr('aria-busy', 'true');
		statusEl.removeClass('knap-preview-view-error');
		statusEl.setAttr('role', 'status');
		statusEl.setText('Rendering preview…');

		try {
			const source = await this.options.service.read(file);
			const dataPath = findDataDirective(source);
			if (!dataPath) {
				this.showError('Add a {# Knap input:path.json #} comment to link template data.');
				return;
			}

			const dataFile = this.options.service.resolveDataFile(file, dataPath);
			if (!dataFile) {
				this.showError(`No JSON file exists at ${dataPath}. Use Edit source to correct the path.`);
				return;
			}
			this.dataFilePath = dataFile.path;

			const dataText = await this.options.service.read(dataFile);
			const variables = parseTemplateData(dataText);
			const result = await renderKnapTemplate(source, variables, this.options.allowRegex());
			if (revision !== this.revision) {
				return;
			}

			if (result.errors.length > 0) {
				this.showError(result.errors.slice(0, 3).map(formatTemplateError).join('\n'));
				return;
			}

			this.previewChild?.unload();
			previewEl.empty();
			const child = new MarkdownRenderChild(previewEl);
			this.previewChild = child;
			child.load();
			await MarkdownRenderer.render(this.app, result.output, previewEl, file.path, child);

			const warnings = result.warnings.slice(0, 3).map(formatTemplateWarning);
			statusEl.setText(warnings.length > 0
				? warnings.join('\n')
				: `Rendered with ${dataFile.path}.`);
		}
		catch (error) {
			if (revision === this.revision) {
				this.showError(`Unable to render the Knap preview. ${errorMessage(error)}`);
				new Notice('Unable to render the Knap preview. Read the error above the preview.');
			}
		}
		finally {
			if (revision === this.revision) {
				previewEl.setAttr('aria-busy', 'false');
			}
		}
	}

	private showError(message: string): void {
		this.previewChild?.unload();
		this.previewChild = null;
		this.previewEl?.empty();
		this.statusEl?.addClass('knap-preview-view-error');
		this.statusEl?.setAttr('role', 'alert');
		this.statusEl?.setText(message);
	}
}
