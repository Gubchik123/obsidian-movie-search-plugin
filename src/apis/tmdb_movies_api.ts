import LanguageDetect from "languagedetect";

import { Movie } from "@models/movie.model";
import { api_get, BaseMoviesAPI } from "@apis/base_api";
import { TMDBMovieResponse, Result } from "./models/tmdb_movies_response";

const language_detector = new LanguageDetect();

export class TMDBMoviesAPI implements BaseMoviesAPI {
	constructor(
		private readonly api_key?: string,
		private readonly include_adult?: boolean,
		private readonly locale_preference?: string,
	) {}

	async get_by_query(query: string) {
		try {
			const search_results = await api_get<TMDBMovieResponse>("https://api.themoviedb.org/3/search/multi", {
				page: 1,
				query: query,
				api_key: this.api_key,
				include_adult: this.include_adult,
				language: this.locale_preference === "auto" ? this.get_language_by_(query) : this.locale_preference,
			});
			if (!search_results?.total_results) return [];
			return search_results.results.map(result => this.create_movie_from_(result));
		} catch (error) {
			console.warn(error);
			throw error;
		}
	}

	get_language_by_(query: string): string {
		const detected_languages = language_detector.detect(query, 3);

		if (detected_languages.length) return detected_languages[0][0].slice(0, 2);
		return window.moment.locale() || "en";
	}

	create_movie_from_(result: Result): Movie {
		const movie: Movie = {
			title: result.title || result.name,
			poster_path: result.poster_path
				? `https://image.tmdb.org/t/p/original${result.poster_path}`
				: `https://image.tmdb.org/t/p/original${result.profile_path}`,
			vote_average: result.vote_average,
			release_date: result.release_date || result.first_air_date,
			overview: result.overview,
			adult: result.adult,
			popularity: result.popularity,
			original_title: result.original_title || result.original_name,
			original_language: result.original_language,
			id: result.id,
			media_type: result.media_type,
			genre_ids: result.genre_ids,
			vote_count: result.vote_count,
			video: result.video,
			backdrop_path: `https://image.tmdb.org/t/p/original${result.backdrop_path}`,
		};
		return movie;
	}
}
