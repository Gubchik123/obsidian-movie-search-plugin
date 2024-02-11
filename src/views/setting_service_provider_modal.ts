import { ServiceProvider } from "@src/constants";
import MovieSearchPlugin from "@src/main";
import { Modal, Setting } from "obsidian";

export class SettingServiceProviderModal extends Modal {
	private readonly plugin: MovieSearchPlugin;
	private readonly current_service_provider: ServiceProvider;

	constructor(plugin: MovieSearchPlugin, private callback?: () => void) {
		super(plugin.app);
		this.plugin = plugin;
		this.current_service_provider = plugin.settings?.service_provider ?? ServiceProvider.tmdb;
	}

	get settings() {
		return this.plugin.settings;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl("h2", { text: "Service Provider Setting" });

		new Setting(contentEl).addButton(btn =>
			btn
				.setButtonText("Save")
				.setCta()
				.onClick(async () => {
					await this.plugin.saveSettings();
					this.close();
					this.callback?.();
				}),
		);
	}

	onClose() {
		this.contentEl.empty();
	}
}
