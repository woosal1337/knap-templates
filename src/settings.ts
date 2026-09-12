import {
	PluginSettingTab,
	Setting,
	type App,
	type SettingDefinitionItem,
} from 'obsidian';
import type KnapTemplatesPlugin from './main';

export interface KnapTemplatesSettings {
	allowRegex: boolean;
	openTemplatesInPreview: boolean;
	openAfterCreate: boolean;
	outputFolder: string;
	templateFolders: string[];
}

export const DEFAULT_SETTINGS: KnapTemplatesSettings = {
	allowRegex: false,
	openTemplatesInPreview: true,
	openAfterCreate: true,
	outputFolder: '',
	templateFolders: ['Templates'],
};

function parseFolderList(value: string): string[] {
	return [...new Set(value
		.split('\n')
		.map(folder => folder.trim().replace(/^\/+|\/+$/gu, ''))
		.filter(Boolean))];
}

export class KnapTemplatesSettingTab extends PluginSettingTab {
	constructor(app: App, private readonly plugin: KnapTemplatesPlugin) {
		super(app, plugin);
	}

	override getSettingDefinitions(): SettingDefinitionItem[] {
		return [
			{
				control: {
					defaultValue: 'Templates',
					key: 'templateFolders',
					rows: 4,
					type: 'textarea',
				},
				desc: 'Enter one vault-relative folder per line. Subfolders are included.',
				name: 'Template folders',
			},
			{
				control: {
					defaultValue: '',
					key: 'outputFolder',
					placeholder: 'Rendered',
					type: 'text',
				},
				desc: 'New notes use this vault-relative folder when the output field contains only a file name.',
				name: 'Default output folder',
			},
			{
				control: {
					defaultValue: true,
					key: 'openTemplatesInPreview',
					type: 'toggle',
				},
				desc: 'Show configured template files as rendered Knap previews. Select the pencil action to edit a template.',
				name: 'Open templates in Knap preview',
			},
			{
				control: {
					defaultValue: true,
					key: 'openAfterCreate',
					type: 'toggle',
				},
				desc: 'Open each rendered note after the plugin creates it.',
				name: 'Open new notes',
			},
			{
				control: {
					defaultValue: false,
					key: 'allowRegex',
					type: 'toggle',
				},
				desc: 'Let Knap filters run regular expressions. Keep this off for templates from untrusted sources.',
				name: 'Allow regular expressions',
			},
		];
	}

	override getControlValue(key: string): unknown {
		if (key === 'templateFolders') {
			return this.plugin.settings.templateFolders.join('\n');
		}
		return this.plugin.settings[key as keyof KnapTemplatesSettings];
	}

	override async setControlValue(key: string, value: unknown): Promise<void> {
		switch (key) {
			case 'templateFolders':
				this.plugin.settings.templateFolders = parseFolderList(String(value));
				break;
			case 'outputFolder':
				this.plugin.settings.outputFolder = String(value).trim().replace(/^\/+|\/+$/gu, '');
				break;
			case 'openAfterCreate':
				this.plugin.settings.openAfterCreate = Boolean(value);
				break;
			case 'openTemplatesInPreview':
				this.plugin.settings.openTemplatesInPreview = Boolean(value);
				break;
			case 'allowRegex':
				this.plugin.settings.allowRegex = Boolean(value);
				break;
			default:
				return;
		}
		await this.plugin.saveSettings();
	}

	override display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('Template folders')
			.setDesc('Enter one vault-relative folder per line. Subfolders are included.')
			.addTextArea(component => {
				component
					.setPlaceholder('Templates')
					.setValue(this.plugin.settings.templateFolders.join('\n'))
					.onChange(async value => {
						this.plugin.settings.templateFolders = parseFolderList(value);
						await this.plugin.saveSettings();
					});
				component.inputEl.rows = 4;
				component.inputEl.setAttr('aria-label', 'Template folders');
			});

		new Setting(containerEl)
			.setName('Default output folder')
			.setDesc('New notes use this vault-relative folder when the output field contains only a file name.')
			.addText(component => component
				.setPlaceholder('Rendered')
				.setValue(this.plugin.settings.outputFolder)
				.onChange(async value => {
					this.plugin.settings.outputFolder = value.trim().replace(/^\/+|\/+$/gu, '');
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Open templates in Knap preview')
			.setDesc('Show configured template files as rendered Knap previews. Select the pencil action to edit a template.')
			.addToggle(component => component
				.setValue(this.plugin.settings.openTemplatesInPreview)
				.onChange(async value => {
					this.plugin.settings.openTemplatesInPreview = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Open new notes')
			.setDesc('Open each rendered note after the plugin creates it.')
			.addToggle(component => component
				.setValue(this.plugin.settings.openAfterCreate)
				.onChange(async value => {
					this.plugin.settings.openAfterCreate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Allow regular expressions')
			.setDesc('Let Knap filters run regular expressions. Keep this off for templates from untrusted sources.')
			.addToggle(component => component
				.setValue(this.plugin.settings.allowRegex)
				.onChange(async value => {
					this.plugin.settings.allowRegex = value;
					await this.plugin.saveSettings();
				}));
	}
}
