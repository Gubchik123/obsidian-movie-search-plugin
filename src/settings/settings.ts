import { App, PluginSettingTab, Setting, Notice } from "obsidian";

import { ServiceProvider } from "@src/constants";
import { SettingServiceProviderModal } from "@views/setting_service_provider_modal";
import MovieSearchPlugin from "../main";
import { FileSuggest } from "./suggesters/FileSuggester";
import { FolderSuggest } from "./suggesters/FolderSuggester";

const safe_storage = (window as any).electron?.remote.safeStorage;

export enum DefaultFrontmatterKeyType {
	snake_case = "Snake Case",
	camel_case = "Camel Case",
}

export interface MovieSearchPluginSettings {
	folder: string; // new file location
	file_name_format: string; // new file name format
	frontmatter: string; // frontmatter that is inserted into the file
	content: string; // what is automatically written to the file.
	use_default_frontmatter: boolean;
	default_frontmatter_key_type: DefaultFrontmatterKeyType;
	template_file: string;
	service_provider: ServiceProvider;
	api_key: string;
	open_page_on_completion: boolean;
}

export const DEFAULT_SETTINGS: MovieSearchPluginSettings = {
	folder: "",
	file_name_format: "{{title}}",
	frontmatter: "",
	content: "",
	use_default_frontmatter: true,
	default_frontmatter_key_type: DefaultFrontmatterKeyType.snake_case,
	template_file: "",
	service_provider: ServiceProvider.tmdb,
	api_key: "",
	open_page_on_completion: true,
};

export class MovieSearchSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: MovieSearchPlugin) {
		super(app, plugin);
	}

	get settings() {
		return this.plugin.settings;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.classList.add("movie-search-plugin__settings");

		createHeader(containerEl, "General Settings");

		// New file location
		new Setting(containerEl)
			.setName("New file location")
			.setDesc("New movie notes will be placed here.")
			.addSearch(cb => {
				try {
					new FolderSuggest(this.app, cb.inputEl);
				} catch {
					// eslint-disable
				}
				cb.setPlaceholder("Example: folder1/folder2")
					.setValue(this.plugin.settings.folder)
					.onChange(new_folder => {
						this.plugin.settings.folder = new_folder;
						this.plugin.saveSettings();
					});
			});

		const template_file = document.createDocumentFragment();
		template_file.createDiv({ text: "Files will be available as templates." });
		new Setting(containerEl)
			.setName("Template file")
			.setDesc(template_file)
			.addSearch(cb => {
				try {
					new FileSuggest(this.app, cb.inputEl);
				} catch {
					// eslint-disable
				}
				cb.setPlaceholder("Example: templates/template-file.md")
					.setValue(this.plugin.settings.template_file)
					.onChange(new_template_file => {
						this.plugin.settings.template_file = new_template_file;
						this.plugin.saveSettings();
					});
			});

		// Service Provider
		let service_provider_extra_settings_button: HTMLElement;
		// eslint-disable-next-line prefer-const
		const hide_service_provider_extra_setting_button = () => {
			service_provider_extra_settings_button.addClass("movie-search-plugin__hide");
		};
		new Setting(containerEl)
			.setName("Service Provider")
			.setDesc("Choose the service provider you want to use to search your movies.")
			.setClass("movie-search-plugin__settings--service_provider")
			.addDropdown(dropDown => {
				dropDown.addOption(ServiceProvider.tmdb, ServiceProvider.tmdb);
				dropDown.setValue(this.plugin.settings?.service_provider ?? ServiceProvider.tmdb);
				dropDown.onChange(async value => {
					const new_value = value as ServiceProvider;
					hide_service_provider_extra_setting_button();
					this.settings["service_provider"] = new_value;
					await this.plugin.saveSettings();
				});
			})
			.addExtraButton(component => {
				service_provider_extra_settings_button = component.extraSettingsEl;
				hide_service_provider_extra_setting_button();
				component.onClick(() => {
					new SettingServiceProviderModal(this.plugin).open();
				});
			});

		// API Settings
		const APISettingsChildren: Setting[] = [];
		createHeader(containerEl, "TMDB API Settings");
		let temp_key_value = "";
		APISettingsChildren.push(
			new Setting(containerEl)
				.setName("TMDB API Key")
				.addText(text => {
					text.inputEl.type = "password";
					text.setValue(this.plugin.settings.api_key).onChange(async value => {
						if (safe_storage && safe_storage.isEncryptionAvailable())
							temp_key_value = safe_storage.encryptString(value).toString("hex");
						else temp_key_value = value;
					});
				})
				.addButton(button => {
					button.setButtonText("Save Key").onClick(async () => {
						this.plugin.settings.api_key = temp_key_value;
						await this.plugin.saveSettings();
						new Notice("Apikey Saved");
					});
				}),
		);
	}
}

function createHeader(container_element: HTMLElement, title: string) {
	const title_element = document.createDocumentFragment();
	title_element.createEl("h2", { text: title });
	return new Setting(container_element).setHeading().setName(title_element);
}
