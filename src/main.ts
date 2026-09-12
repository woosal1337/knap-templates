import {
	Notice,
	Plugin,
	TFile,
	type Menu,
} from 'obsidian';
import {
	findDataDirective,
	parseTemplateData,
	suggestOutputFile,
} from './core/data';
import { formatTemplateError, validateKnapTemplate } from './core/engine';
import { joinVaultPath } from './core/path';
import {
	DEFAULT_SETTINGS,
	KnapTemplatesSettingTab,
	type KnapTemplatesSettings,
} from './settings';
import { TemplateService } from './services/template-service';
import { RenderTemplateModal } from './ui/render-modal';
import { TemplatePicker } from './ui/template-picker';

export default class KnapTemplatesPlugin extends Plugin {
	override settings: KnapTemplatesSettings = {
		...DEFAULT_SETTINGS,
		templateFolders: [...DEFAULT_SETTINGS.templateFolders],
	};
	private service!: TemplateService;

	override async onload(): Promise<void> {
		await this.loadSettings();
		this.service = new TemplateService(this.app);
		this.addSettingTab(new KnapTemplatesSettingTab(this.app, this));

		this.addRibbonIcon('file-output', 'Create note from Knap template', () => {
			void this.openTemplatePicker();
		});

		this.addCommand({
			id: 'create-note-from-template',
			name: 'Create note from template',
			callback: () => {
				void this.openTemplatePicker();
			},
		});

		this.addCommand({
			id: 'render-active-template',
			name: 'Render active template',
			checkCallback: checking => {
				const file = this.app.workspace.getActiveFile();
				if (!file || !this.service.isTemplateFile(file)) {
					return false;
				}
				if (!checking) {
					void this.openRenderModal(file);
				}
				return true;
			},
		});

		this.addCommand({
			id: 'validate-active-template',
			name: 'Validate active template',
			checkCallback: checking => {
				const file = this.app.workspace.getActiveFile();
				if (!file || !this.service.isTemplateFile(file)) {
					return false;
				}
				if (!checking) {
					void this.validateTemplate(file);
				}
				return true;
			},
		});

		this.registerEvent(this.app.workspace.on('file-menu', (menu: Menu, file) => {
			if (!(file instanceof TFile)
				|| !this.service.isTemplateFile(file)
				|| !this.service.isInTemplateFolder(file, this.settings.templateFolders)) {
				return;
			}

			menu.addItem(item => item
				.setTitle('Render with Knap')
				.setIcon('file-output')
				.onClick(() => {
					void this.openRenderModal(file);
				}));
		}));
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	private async loadSettings(): Promise<void> {
		const saved = await this.loadData() as Partial<KnapTemplatesSettings> | null;
		this.settings = {
			...DEFAULT_SETTINGS,
			...saved,
			templateFolders: saved?.templateFolders ?? [...DEFAULT_SETTINGS.templateFolders],
		};
	}

	private async openTemplatePicker(): Promise<void> {
		const templates = this.service.listTemplates(this.settings.templateFolders);
		if (templates.length === 0) {
			const folders = this.settings.templateFolders.join(', ') || 'none';
			new Notice(`No templates found. Add a folder in Knap Templates settings. Current folders: ${folders}.`);
			return;
		}

		new TemplatePicker(this.app, templates, file => {
			void this.openRenderModal(file);
		}).open();
	}

	private async openRenderModal(template: TFile): Promise<void> {
		const templateSource = await this.service.read(template);
		const directivePath = findDataDirective(templateSource) ?? '';
		let initialDataText = '{}';
		let initialMessage: string | undefined;

		if (directivePath) {
			const dataFile = this.service.resolveDataFile(template, directivePath);
			if (dataFile) {
				initialDataText = await this.service.read(dataFile);
			}
			else {
				initialMessage = `The template refers to ${directivePath}, but that JSON file does not exist.`;
			}
		}

		let variables = {};
		try {
			variables = parseTemplateData(initialDataText);
		}
		catch {
			initialMessage = 'The linked data file is not valid JSON. Fix it in the template data field.';
		}

		const outputName = suggestOutputFile(template.name, variables);
		const outputPath = joinVaultPath(this.settings.outputFolder, outputName);
		const modalOptions = {
			allowRegex: this.settings.allowRegex,
			defaultOutputFolder: this.settings.outputFolder,
			initialDataPath: directivePath,
			initialDataText,
			openAfterCreate: this.settings.openAfterCreate,
			outputPath,
			service: this.service,
			template,
			templateSource,
			...(initialMessage ? { initialMessage } : {}),
		};

		new RenderTemplateModal(this.app, modalOptions).open();
	}

	private async validateTemplate(file: TFile): Promise<void> {
		const source = await this.service.read(file);
		const errors = validateKnapTemplate(source, this.settings.allowRegex);

		if (errors.length === 0) {
			new Notice('The Knap template is valid.');
			return;
		}

		const first = formatTemplateError(errors[0]!);
		const suffix = errors.length === 1 ? 'error' : 'errors';
		new Notice(`Knap found ${errors.length} ${suffix}. ${first}`);
	}
}
