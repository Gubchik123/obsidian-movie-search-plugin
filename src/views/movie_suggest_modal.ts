import { App, SuggestModal } from "obsidian";
import { Movie } from "@models/movie.model";

export class MovieSuggestModal extends SuggestModal<Movie> {
	constructor(
		app: App,
		private readonly suggestion: Movie[],
		private onChoose: (error: Error | null, result?: Movie) => void,
	) {
		super(app);
	}

	getSuggestions(query: string): Movie[] {
		return this.suggestion.filter(movie => {
			const search_query = query?.toLowerCase();
			return (
				movie.title?.toLowerCase().includes(search_query) ||
				movie.original_title?.toLowerCase().includes(search_query) ||
				movie.release_date?.toLowerCase().includes(search_query)
			);
		});
	}

	renderSuggestion(movie: Movie, element: HTMLElement) {
		element.createEl("div", { text: movie.title });

		const media_type = movie.media_type.toUpperCase();
		const release_date = movie.release_date ? movie.release_date : "-";
		const original_title = movie.original_title ? movie.original_title : "-";
		element.createEl("small", {
			text:
				movie.title === original_title
					? `${media_type}: ${release_date}`
					: `${media_type}: ${original_title} (${release_date})`,
		});
	}

	onChooseSuggestion(movie: Movie) {
		this.onChoose(null, movie);
	}
}
