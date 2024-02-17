import { Editor, MarkdownView, Notice, Plugin, TFile, stringifyYaml } from "obsidian";

import { MovieSearchModal } from "@views/movie_search_modal";
import { MovieSuggestModal } from "@views/movie_suggest_modal";
import { CursorJumper } from "@utils/cursor_jumper";
import { Movie } from "@models/movie.model";
import {
	MovieSearchSettingTab,
	MovieSearchPluginSettings as MovieSearchPluginSettings,
	DEFAULT_SETTINGS,
} from "@settings/settings";
import {
	get_template_contents,
	apply_template_transformations,
	use_templater_plugin_in_file,
	execute_inline_scripts_template,
} from "@utils/template";
import { replace_variable_syntax, make_file_name_for_, apply_default_frontmatter } from "@utils/utils";

export default class MovieSearchPlugin extends Plugin {
	settings: MovieSearchPluginSettings;

	async onload() {
		await this.loadSettings();

		const ribbon_icon_element = this.addRibbonIcon("star", "Create new movie note", () =>
			this.create_new_movie_note(),
		);
		ribbon_icon_element.addClass("obsidian-movie-search-plugin-ribbon-class");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-movie-search-modal",
			name: "Create new movie note",
			callback: () => this.create_new_movie_note(),
		});
		this.addCommand({
			id: "open-movie-search-modal-to-insert",
			name: "Insert a movie data",
			editorCallback: (editor: Editor, view: MarkdownView) => this.insert_data(editor, view.file.basename),
		});
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new MovieSearchSettingTab(this.app, this));

		console.log(
			`Movie Search: version ${this.manifest.version} (requires obsidian ${this.manifest.minAppVersion})`,
		);
	}

	show_notice(message: unknown) {
		try {
			new Notice(message?.toString());
		} catch {
			// eslint-disable
		}
	}

	async search_movie_data(query?: string): Promise<Movie> {
		const searchedMovies = await this.open_movie_search_modal(query);
		return await this.open_movie_suggest_modal(searchedMovies);
	}

	async get_rendered_contents(movie: Movie) {
		const {
			template_file,
			use_default_frontmatter,
			default_frontmatter_key_type,
			frontmatter, // @deprecated
			content, // @deprecated
		} = this.settings;

		if (template_file) {
			const template_contents = await get_template_contents(this.app, template_file);
			const replaced_variable = replace_variable_syntax(movie, apply_template_transformations(template_contents));
			return execute_inline_scripts_template(movie, replaced_variable);
		}
		let replaced_variable_frontmatter = replace_variable_syntax(movie, frontmatter); // @deprecated
		if (use_default_frontmatter) {
			replaced_variable_frontmatter = stringifyYaml(
				apply_default_frontmatter(movie, replaced_variable_frontmatter, default_frontmatter_key_type),
			);
		}
		const replaced_variable_content = replace_variable_syntax(movie, content);

		return replaced_variable_frontmatter
			? `---\n${replaced_variable_frontmatter}\n---\n${replaced_variable_content}`
			: replaced_variable_content;
	}

	async insert_data(editor: Editor, file_basename: string): Promise<void> {
		try {
			const movie = await this.search_movie_data(file_basename);
			const renderedContents = await this.get_rendered_contents(movie);
			editor.replaceRange(renderedContents, { line: 0, ch: 0 });
		} catch (err) {
			console.warn(err);
			this.show_notice(err);
		}
	}

	async create_new_movie_note(): Promise<void> {
		try {
			const movie = await this.search_movie_data();
			const rendered_contents = await this.get_rendered_contents(movie);

			// create new File
			const fileName = make_file_name_for_(movie, this.settings.file_name_format);
			const filePath = `${this.settings.folder}/${fileName}`;
			const targetFile = await this.app.vault.create(filePath, rendered_contents);

			await use_templater_plugin_in_file(this.app, targetFile);
			this.open_new_movie_note(targetFile);
		} catch (err) {
			console.warn(err);
			this.show_notice(err);
		}
	}

	async open_new_movie_note(target_file: TFile) {
		if (!this.settings.open_page_on_completion) return;
		// open file
		const active_leaf = this.app.workspace.getLeaf();
		if (!active_leaf) {
			console.warn("No active leaf");
			return;
		}
		await active_leaf.openFile(target_file, { state: { mode: "source" } });
		active_leaf.setEphemeralState({ rename: "all" });
		// cursor focus
		await new CursorJumper(this.app).jump_to_next_cursor_location();
	}

	async open_movie_search_modal(query = ""): Promise<Movie[]> {
		return new Promise((resolve, reject) => {
			return new MovieSearchModal(this, query, (error, results) => {
				return error ? reject(error) : resolve(results);
			}).open();
		});
	}

	async open_movie_suggest_modal(movies: Movie[]): Promise<Movie> {
		return new Promise((resolve, reject) => {
			return new MovieSuggestModal(this.app, movies, (error, selected_movie) => {
				return error ? reject(error) : resolve(selected_movie);
			}).open();
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
