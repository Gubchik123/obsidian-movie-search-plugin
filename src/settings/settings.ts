import { App, PluginSettingTab, Setting } from "obsidian";

import { ServiceProvider } from "@src/constants";

import MovieSearchPlugin from "../main";

import { FileSuggest } from "./suggesters/FileSuggester";
import { FolderSuggest } from "./suggesters/FolderSuggester";

const plugin_repo_url = "https://github.com/Gubchik123/obsidian-movie-search-plugin";

export enum DefaultFrontmatterKeyType {
	snake_case = "Snake Case",
	camel_case = "Camel Case",
}

export interface MovieSearchPluginSettings {
	folder: string; // new file location
	file_name_format: string; // new file name format
	template_file: string;
	open_page_on_completion: boolean;
	locale_preference: string;
	ask_preferred_locale: boolean;
	api_key: string;
	include_adult: boolean;
	// Hidden from the user settings
	service_provider: ServiceProvider;
	recent_locales: {
		[locale: string]: number;
	};
	no_api_key_attempts: number;
	// Default settings
	frontmatter: string; // frontmatter that is inserted into the file
	content: string; // what is automatically written to the file.
	use_default_frontmatter: boolean;
	default_frontmatter_key_type: DefaultFrontmatterKeyType;
}

export const DEFAULT_SETTINGS: MovieSearchPluginSettings = {
	folder: "",
	file_name_format: "",
	template_file: "",
	open_page_on_completion: true,
	locale_preference: "auto",
	ask_preferred_locale: false,
	api_key: "",
	include_adult: false,
	// Hidden from the user settings
	service_provider: ServiceProvider.tmdb,
	recent_locales: {},
	no_api_key_attempts: 0,
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
		// New File Name Format
		const file_name_format_desc = document.createDocumentFragment();
		file_name_format_desc.createEl("a", {
			text: "Variables",
			href: `${plugin_repo_url}#template-variables-definitions`,
		});
		new Setting(containerEl)
			.setClass("movie-search-plugin__settings--new_file_name")
			.setClass("movie-search-plugin__settings--new_file_name_hint")
			.setName("New file name format")
			.setDesc(file_name_format_desc)
			.addText(cb => {
				cb.setPlaceholder("Example: {{title}}")
					.setValue(this.plugin.settings.file_name_format)
					.onChange(new_value => {
						this.plugin.settings.file_name_format = new_value?.trim();
						this.plugin.saveSettings();
					});
			});
		// Template File
		const template_file_desc = document.createDocumentFragment();
		template_file_desc.createDiv({ text: "Files will be available as templates." });
		template_file_desc.createEl("a", {
			text: "Example template",
			href: `${plugin_repo_url}#example-template`,
		});
		new Setting(containerEl)
			.setName("Template file")
			.setDesc(template_file_desc)
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
			.setName("Preferred locale")
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
			.setName("Ask preferred locale")
			.setDesc("Enable or disable the prompt for the preferred locale before searching for movies.")
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.ask_preferred_locale).onChange(async value => {
					this.plugin.settings.ask_preferred_locale = value;
					await this.plugin.saveSettings();
				}),
			);
		new Setting(containerEl)
			.setName("Open new movie note")
			.setDesc("Enable or disable the automatic opening of the note on creation.")
			.addToggle(toggle =>
				toggle.setValue(this.plugin.settings.open_page_on_completion).onChange(async value => {
					this.plugin.settings.open_page_on_completion = value;
					await this.plugin.saveSettings();
				}),
			);
		// API Settings
		new Setting(containerEl).setName("TMDB").setHeading();

		const APISettings: Setting[] = [];

		const api_key_desc = document.createDocumentFragment();
		api_key_desc.createEl("a", {
			text: "Login and get your API Key here.",
			href: "https://www.themoviedb.org/settings/api",
		});
		APISettings.push(
			new Setting(containerEl)
				.setName("API key")
				.setDesc(api_key_desc)
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
				.setName("Include adult")
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
