import { Editor, MarkdownView, Notice, Plugin, TFile, stringifyYaml } from "obsidian";

import { MovieSearchModal } from "@views/movie_search_modal";
import { MovieSuggestModal } from "@views/movie_suggest_modal";
import { FileExistsModal } from "@views/file_exists_modal";
import { CursorJumper } from "@utils/cursor_jumper";
import { MovieSearch, Movie } from "@models/movie.model";
import { get_service_provider } from "@apis/base_api";
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
import {
	replace_variable_syntax,
	make_file_name_for_,
	make_folder_path_for_,
	apply_default_frontmatter,
} from "@utils/utils";

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

	async get_movie_search_data(query?: string): Promise<MovieSearch> {
		const searched_movies = await this.open_movie_search_modal(query);
		if (searched_movies.length == 1) return searched_movies[0];
		return await this.open_movie_suggest_modal(searched_movies);
	}

	async get_movie_data(movie_search: MovieSearch): Promise<Movie> {
		const service_provider = get_service_provider(this.settings);
		return await service_provider.get_movie_by_(movie_search.id, movie_search.media_type);
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
			// TODO: Use the selected text as a search query.
			const movie_search = await this.get_movie_search_data(file_basename);
			const movie = await this.get_movie_data(movie_search);
			const rendered_contents = await this.get_rendered_contents(movie);
			editor.replaceRange(rendered_contents, { line: 0, ch: 0 });
		} catch (err) {
			console.warn(err);
			this.show_notice(err);
		}
	}

	async create_new_movie_note(): Promise<void> {
		try {
			const movie_search = await this.get_movie_search_data();
			const movie = await this.get_movie_data(movie_search);
			const rendered_contents = await this.get_rendered_contents(movie);
			// Create new file.
			const file_path = await this.get_file_path_for_(movie);
			const file = this.app.vault.getAbstractFileByPath(file_path);

			if (file) {
				const is_overwrite = await this.open_file_exists_modal();
				if (!is_overwrite) return;
				await this.app.vault.delete(file);
			}
			const target_file = await this.app.vault.create(file_path, rendered_contents);
			await use_templater_plugin_in_file(this.app, target_file);
			this.open_new_movie_note(target_file);
		} catch (err) {
			console.warn(err);
			this.show_notice(err);
		}
	}

	private async get_file_path_for_(movie: Movie): Promise<string> {
		const file_name = make_file_name_for_(movie, this.settings.file_name_format);
		const folder_path = make_folder_path_for_(movie, this.settings.folder);
		try {
			await this.app.vault.createFolder(folder_path);
		} catch (err) {
			console.warn(err);
		}
		return `${folder_path}/${file_name}`;
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

	async open_movie_search_modal(query = ""): Promise<MovieSearch[]> {
		return new Promise((resolve, reject) => {
			return new MovieSearchModal(this, query, (error, results) => {
				return error ? reject(error) : resolve(results);
			}).open();
		});
	}

	async open_movie_suggest_modal(movies: MovieSearch[]): Promise<MovieSearch> {
		return new Promise((resolve, reject) => {
			return new MovieSuggestModal(this.app, movies, (error, selected_movie) => {
				return error ? reject(error) : resolve(selected_movie);
			}).open();
		});
	}

	async open_file_exists_modal(): Promise<boolean> {
		return new Promise((resolve, reject) => {
			const modal = new FileExistsModal(this.app);
			modal.open();
			modal
				.waitForResult()
				.then(result => {
					resolve(result);
				})
				.catch(error => {
					reject(error);
				});
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}
