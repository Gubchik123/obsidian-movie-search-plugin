import { App, Modal, ButtonComponent } from "obsidian";

export class IsBoolModal extends Modal {
	protected question: string;
	protected yes_button_text: string;
	protected no_button_text: string;

	protected resolve: ((value: boolean) => void) | null = null;

	constructor(app: App, question: string, yes_button_text: string, no_button_text: string) {
		super(app);
		this.question = question;
		this.yes_button_text = yes_button_text;
		this.no_button_text = no_button_text;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: this.question });

		new ButtonComponent(contentEl)
			.setButtonText(this.yes_button_text)
			.setCta()
			.setClass("movie-search-plugin__modal-button")
			.onClick(() => {
				if (this.resolve) this.resolve(true);
				this.close();
			});
		new ButtonComponent(contentEl)
			.setButtonText(this.no_button_text)
			.setClass("movie-search-plugin__modal-button")
			.onClick(() => {
				if (this.resolve) this.resolve(false);
				this.close();
			});
	}

	waitForResult(): Promise<boolean> {
		return new Promise(resolve => {
			this.resolve = resolve;
		});
	}
}
