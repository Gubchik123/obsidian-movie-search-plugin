import { App, PluginSettingTab, Setting } from "obsidian";

import { ServiceProvider } from "@src/constants";

import MovieSearchPlugin from "../main";

import { FileSuggest } from "./suggesters/FileSuggester";
import { FolderSuggest } from "./suggesters/FolderSuggester";

export enum DefaultFrontmatterKeyType {
	snake_case = "Snake Case",
	camel_case = "Camel Case",
}

export interface MovieSearchPluginSettings {
	folder: string; // new file location
	template_file: string;
	open_page_on_completion: boolean;
	locale_preference: string;
	service_provider: ServiceProvider;
	api_key: string;
	include_adult: boolean;
	// Default settings
	frontmatter: string; // frontmatter that is inserted into the file
	content: string; // what is automatically written to the file.
	use_default_frontmatter: boolean;
	default_frontmatter_key_type: DefaultFrontmatterKeyType;
}

export const DEFAULT_SETTINGS: MovieSearchPluginSettings = {
	folder: "",
	template_file: "",
	open_page_on_completion: true,
	locale_preference: "auto",
	service_provider: ServiceProvider.tmdb,
	api_key: "",
	include_adult: false,
	// Default settings
	frontmatter: "",
	content: "",
	use_default_frontmatter: true,
	default_frontmatter_key_type: DefaultFrontmatterKeyType.snake_case,
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
		// General Settings
		new Setting(containerEl)
			.setName("New File Location")
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
		new Setting(containerEl)
			.setName("Template File")
			.setDesc("Files will be available as templates.")
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
		new Setting(containerEl)
			.setName("Preferred Locale")
			.setDesc("Sets the preferred locale to use when searching for movies.")
			.addDropdown(dropdown => {
				const default_locale = "auto";

				dropdown.addOption(default_locale, default_locale);
				window.moment.locales().forEach(locale => {
					dropdown.addOption(locale, locale);
				});

				const set_value = this.settings.locale_preference;
				if (set_value === "auto") dropdown.setValue(default_locale);
				else dropdown.setValue(set_value);

				dropdown.onChange(async value => {
					const new_value = value;
					this.settings.locale_preference = new_value;
					await this.plugin.saveSettings();
				});
			});
		new Setting(containerEl)
			.setName("Open New Movie Note")
			.setDesc("Enable or disable the automatic opening of the note on creation.")
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.open_page_on_completion).onChange(async value => {
					this.plugin.settings.open_page_on_completion = value;
					await this.plugin.saveSettings();
				}),
			);
		new Setting(containerEl)
			.setName("Service Provider")
			.setDesc("Choose the service provider you want to use to search your movies.")
			.setClass("movie-search-plugin__settings--service_provider")
			.addDropdown(dropDown => {
				dropDown.addOption(ServiceProvider.tmdb, ServiceProvider.tmdb);
				dropDown.setValue(this.plugin.settings?.service_provider ?? ServiceProvider.tmdb);
				dropDown.onChange(async value => {
					const new_value = value as ServiceProvider;
					this.settings["service_provider"] = new_value;
					await this.plugin.saveSettings();
				});
			});
		// API Settings
		new Setting(containerEl).setName(`${this.plugin.settings.service_provider.toUpperCase()} API`).setHeading();

		const APISettings: Setting[] = [];
		APISettings.push(
			new Setting(containerEl)
				.setName("API Key")
				.setDesc("WARNING: It is not 'Bearer' JSON Web Token (JWT).")
				.addText(text => {
					text.inputEl.type = "password";
					text.setValue(this.plugin.settings.api_key).onChange(async value => {
						this.plugin.settings.api_key = value;
						await this.plugin.saveSettings();
					});
				}),
		);
		APISettings.push(
			new Setting(containerEl)
				.setName("Include Adult")
				.setDesc("Enable or disable adult content.")
				.addToggle(toggle =>
					toggle.setValue(this.plugin.settings.include_adult).onChange(async value => {
						this.plugin.settings.include_adult = value;
						await this.plugin.saveSettings();
					}),
				),
		);
	}
}
