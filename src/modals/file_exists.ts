import { App, Modal, ButtonComponent } from "obsidian";

export class FileExistsModal extends Modal {
	private resolve: ((value: boolean) => void) | null = null;

	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "File already exists. Do you want to overwrite it?" });

		new ButtonComponent(contentEl)
			.setButtonText("Yes, overwrite")
			.setCta()
			.setClass("movie-search-plugin__modal-button")
			.onClick(() => {
				if (this.resolve) this.resolve(true);
				this.close();
			});
		new ButtonComponent(contentEl)
			.setButtonText("No, cancel")
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
