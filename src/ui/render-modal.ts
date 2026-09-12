import {
	ButtonComponent,
	MarkdownRenderChild,
	MarkdownRenderer,
	Modal,
	Notice,
	type App,
	type TFile,
} from 'obsidian';
import { parseTemplateData } from '../core/data';
import {
	formatTemplateError,
	formatTemplateWarning,
	renderKnapTemplate,
} from '../core/engine';
import { OutputPathError } from '../core/path';
import type { TemplateService } from '../services/template-service';

interface RenderModalOptions {
	allowRegex: boolean;
	defaultOutputFolder: string;
	initialDataPath: string;
	initialDataText: string;
	initialMessage?: string;
	openAfterCreate: boolean;
	outputPath: string;
	service: TemplateService;
	template: TFile;
	templateSource: string;
}

interface FieldElements {
	controlEl: HTMLDivElement;
	errorEl: HTMLParagraphElement;
}

function createField(
	container: HTMLElement,
	id: string,
	labelText: string,
	description: string,
): FieldElements {
	const fieldEl = container.createDiv({ cls: 'knap-field' });
	const labelEl = fieldEl.createEl('label', {
		cls: 'knap-field-label',
		text: labelText,
	});
	labelEl.htmlFor = id;

	const descriptionId = `${id}-description`;
	fieldEl.createEl('p', {
		attr: { id: descriptionId },
		cls: 'knap-field-description',
		text: description,
	});

	const controlEl = fieldEl.createDiv({ cls: 'knap-field-control' });
	const errorEl = fieldEl.createEl('p', {
		attr: {
			id: `${id}-error`,
			role: 'alert',
		},
		cls: 'knap-field-error',
	});
	errorEl.hidden = true;

	return { controlEl, errorEl };
}

function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : 'An unknown error stopped the render.';
}

export class RenderTemplateModal extends Modal {
	private alertEl!: HTMLDivElement;
	private createButton!: ButtonComponent;
	private dataPathErrorEl!: HTMLParagraphElement;
	private dataPathInput!: HTMLInputElement;
	private dataTextErrorEl!: HTMLParagraphElement;
	private dataTextInput!: HTMLTextAreaElement;
	private outputErrorEl!: HTMLParagraphElement;
	private outputInput!: HTMLInputElement;
	private previewChild: MarkdownRenderChild | null = null;
	private previewEl!: HTMLDivElement;
	private previewRevision = 0;
	private previewTimer: number | null = null;
	private statusEl!: HTMLDivElement;
	private creating = false;

	constructor(app: App, private readonly options: RenderModalOptions) {
		super(app);
	}

	override onOpen(): void {
		this.modalEl.addClass('knap-render-modal');
		this.setTitle('Render Knap template');

		const formEl = this.contentEl.createEl('form', { cls: 'knap-render-form' });
		formEl.addEventListener('submit', event => {
			event.preventDefault();
			void this.createNote();
		});

		const templateEl = formEl.createDiv({ cls: 'knap-template-source' });
		templateEl.createSpan({ cls: 'knap-field-label', text: 'Template' });
		templateEl.createEl('code', { text: this.options.template.path });

		this.createDataPathField(formEl);
		this.createDataTextField(formEl);
		this.createOutputField(formEl);

		this.alertEl = formEl.createDiv({
			attr: { role: 'alert' },
			cls: ['knap-message', 'knap-message-error'],
		});
		this.alertEl.hidden = true;

		this.statusEl = formEl.createDiv({
			attr: {
				'aria-live': 'polite',
				role: 'status',
			},
			cls: 'knap-message',
		});

		const previewSection = formEl.createEl('section', { cls: 'knap-preview-section' });
		previewSection.createEl('h3', { text: 'Preview' });
		this.previewEl = previewSection.createDiv({ cls: 'knap-preview markdown-rendered' });

		const buttonsEl = formEl.createDiv({ cls: 'knap-button-row' });
		new ButtonComponent(buttonsEl)
			.setButtonText('Cancel')
			.onClick(() => this.close());

		this.createButton = new ButtonComponent(buttonsEl)
			.setButtonText('Create note')
			.setCta();
		this.createButton.buttonEl.type = 'submit';

		if (this.options.initialMessage) {
			this.setStatus(this.options.initialMessage);
		}

		void this.refreshPreview();
		window.setTimeout(() => this.dataTextInput.focus(), 0);
	}

	override onClose(): void {
		if (this.previewTimer !== null) {
			window.clearTimeout(this.previewTimer);
		}
		this.previewChild?.unload();
		this.previewChild = null;
		this.contentEl.empty();
	}

	private createDataPathField(formEl: HTMLFormElement): void {
		const id = 'knap-data-path';
		const field = createField(
			formEl,
			id,
			'Data file',
			'Enter an optional JSON file path. Relative paths start at the template folder.',
		);
		this.dataPathErrorEl = field.errorEl;

		const rowEl = field.controlEl.createDiv({ cls: 'knap-inline-control' });
		this.dataPathInput = rowEl.createEl('input', {
			attr: {
				'aria-describedby': `${id}-description ${id}-error`,
				autocomplete: 'off',
				id,
				placeholder: 'examples/machine.json',
				type: 'text',
			},
			type: 'text',
			value: this.options.initialDataPath,
		});
		this.dataPathInput.spellcheck = false;

		const loadButton = new ButtonComponent(rowEl)
			.setButtonText('Load data')
			.onClick(() => {
				void this.loadDataFile();
			});
		loadButton.buttonEl.type = 'button';
	}

	private createDataTextField(formEl: HTMLFormElement): void {
		const id = 'knap-data-json';
		const field = createField(
			formEl,
			id,
			'Template data',
			'Enter one JSON object. The object keys become Knap variables.',
		);
		this.dataTextErrorEl = field.errorEl;

		this.dataTextInput = field.controlEl.createEl('textarea', {
			attr: {
				'aria-describedby': `${id}-description ${id}-error`,
				id,
				rows: '10',
			},
			cls: 'knap-data-editor',
			text: this.options.initialDataText,
		});
		this.dataTextInput.spellcheck = false;
		this.dataTextInput.addEventListener('input', () => this.schedulePreview());
	}

	private createOutputField(formEl: HTMLFormElement): void {
		const id = 'knap-output-path';
		const field = createField(
			formEl,
			id,
			'Output file',
			'Enter a vault-relative Markdown path. Existing files are not replaced.',
		);
		this.outputErrorEl = field.errorEl;

		this.outputInput = field.controlEl.createEl('input', {
			attr: {
				'aria-describedby': `${id}-description ${id}-error`,
				autocomplete: 'off',
				id,
				type: 'text',
			},
			type: 'text',
			value: this.options.outputPath,
		});
		this.outputInput.spellcheck = false;
	}

	private schedulePreview(): void {
		if (this.previewTimer !== null) {
			window.clearTimeout(this.previewTimer);
		}
		this.previewTimer = window.setTimeout(() => {
			this.previewTimer = null;
			void this.refreshPreview();
		}, 150);
	}

	private async loadDataFile(): Promise<void> {
		this.clearDataPathError();
		const requestedPath = this.dataPathInput.value.trim();
		if (!requestedPath) {
			this.setDataPathError('Enter a JSON file path, then select Load data.');
			this.dataPathInput.focus();
			return;
		}

		const file = this.options.service.resolveDataFile(this.options.template, requestedPath);
		if (!file) {
			this.setDataPathError(`No JSON file exists at ${requestedPath}. Use a vault-relative path.`);
			this.dataPathInput.focus();
			return;
		}

		this.dataTextInput.value = await this.options.service.read(file);
		this.setStatus(`Loaded data from ${file.path}.`);
		await this.refreshPreview();
	}

	private async refreshPreview(): Promise<void> {
		const revision = ++this.previewRevision;
		this.clearAlert();
		this.clearDataTextError();
		this.previewEl.setAttr('aria-busy', 'true');

		let variables;
		try {
			variables = parseTemplateData(this.dataTextInput.value);
		}
		catch (error) {
			if (revision !== this.previewRevision) {
				return;
			}
			this.previewEl.empty();
			this.setDataTextError(errorMessage(error));
			this.previewEl.setAttr('aria-busy', 'false');
			return;
		}

		try {
			const result = await renderKnapTemplate(
				this.options.templateSource,
				variables,
				this.options.allowRegex,
			);
			if (revision !== this.previewRevision) {
				return;
			}

			if (result.errors.length > 0) {
				this.previewEl.empty();
				this.setAlert(result.errors.slice(0, 3).map(formatTemplateError).join('\n'));
				return;
			}

			this.previewChild?.unload();
			this.previewEl.empty();
			const child = new MarkdownRenderChild(this.previewEl);
			this.previewChild = child;
			child.load();
			await MarkdownRenderer.render(
				this.app,
				result.output,
				this.previewEl,
				this.options.template.path,
				child,
			);

			if (result.warnings.length > 0) {
				this.setStatus(result.warnings.slice(0, 3).map(formatTemplateWarning).join('\n'));
			}
			else if (!this.options.initialMessage) {
				this.setStatus('The preview is current.');
			}
		}
		catch (error) {
			if (revision === this.previewRevision) {
				this.previewEl.empty();
				this.setAlert(`Unable to render the template. ${errorMessage(error)}`);
			}
		}
		finally {
			if (revision === this.previewRevision) {
				this.previewEl.setAttr('aria-busy', 'false');
			}
		}
	}

	private async createNote(): Promise<void> {
		if (this.creating) {
			return;
		}

		this.clearAlert();
		this.clearDataTextError();
		this.clearOutputError();

		let variables;
		try {
			variables = parseTemplateData(this.dataTextInput.value);
		}
		catch (error) {
			this.setDataTextError(errorMessage(error));
			this.dataTextInput.focus();
			return;
		}

		this.setCreating(true);
		try {
			const result = await renderKnapTemplate(
				this.options.templateSource,
				variables,
				this.options.allowRegex,
			);

			if (result.errors.length > 0) {
				this.setAlert(result.errors.slice(0, 3).map(formatTemplateError).join('\n'));
				return;
			}
			if (!result.output.trim()) {
				this.setAlert('The rendered note is empty. Add content to the template or its data.');
				return;
			}

			const created = await this.options.service.createNote(
				this.outputInput.value,
				this.options.defaultOutputFolder,
				result.output,
			);
			new Notice(`Created ${created.path}.`);

			if (this.options.openAfterCreate) {
				await this.app.workspace.getLeaf(false).openFile(created);
			}
			this.close();
		}
		catch (error) {
			if (error instanceof OutputPathError) {
				this.setOutputError(error.message);
			}
			else {
				this.setOutputError(`Unable to create the note. ${errorMessage(error)}`);
			}
			this.outputInput.focus();
		}
		finally {
			this.setCreating(false);
		}
	}

	private setCreating(creating: boolean): void {
		this.creating = creating;
		this.createButton
			.setDisabled(creating)
			.setButtonText(creating ? 'Creating…' : 'Create note');
		this.createButton.buttonEl.toggleClass('knap-is-loading', creating);
		this.createButton.buttonEl.setAttr('aria-busy', creating ? 'true' : 'false');
	}

	private setAlert(message: string): void {
		this.alertEl.setText(message);
		this.alertEl.hidden = false;
	}

	private clearAlert(): void {
		this.alertEl.empty();
		this.alertEl.hidden = true;
	}

	private setStatus(message: string): void {
		this.statusEl.setText(message);
	}

	private setDataPathError(message: string): void {
		this.dataPathInput.setAttr('aria-invalid', 'true');
		this.dataPathErrorEl.setText(message);
		this.dataPathErrorEl.hidden = false;
	}

	private clearDataPathError(): void {
		this.dataPathInput.removeAttribute('aria-invalid');
		this.dataPathErrorEl.empty();
		this.dataPathErrorEl.hidden = true;
	}

	private setDataTextError(message: string): void {
		this.dataTextInput.setAttr('aria-invalid', 'true');
		this.dataTextErrorEl.setText(message);
		this.dataTextErrorEl.hidden = false;
	}

	private clearDataTextError(): void {
		this.dataTextInput.removeAttribute('aria-invalid');
		this.dataTextErrorEl.empty();
		this.dataTextErrorEl.hidden = true;
	}

	private setOutputError(message: string): void {
		this.outputInput.setAttr('aria-invalid', 'true');
		this.outputErrorEl.setText(message);
		this.outputErrorEl.hidden = false;
	}

	private clearOutputError(): void {
		this.outputInput.removeAttribute('aria-invalid');
		this.outputErrorEl.empty();
		this.outputErrorEl.hidden = true;
	}
}
