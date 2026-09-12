import { FuzzySuggestModal, type App, type TFile } from 'obsidian';

export class TemplatePicker extends FuzzySuggestModal<TFile> {
	constructor(
		app: App,
		private readonly files: readonly TFile[],
		private readonly choose: (file: TFile) => void,
	) {
		super(app);
		this.setPlaceholder('Choose a Knap template');
	}

	getItems(): TFile[] {
		return [...this.files];
	}

	getItemText(file: TFile): string {
		return file.path;
	}

	onChooseItem(file: TFile): void {
		this.choose(file);
	}
}
