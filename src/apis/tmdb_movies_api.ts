import { api_get, BaseMoviesAPI } from "@apis/base_api";
import { Movie } from "@models/movie.model";
import { TMDBMovieResponse, Result } from "./models/tmdb_movies_response";

import LanguageDetect from "languagedetect";

const language_detector = new LanguageDetect();

export class TMDBMoviesAPI implements BaseMoviesAPI {
	constructor(private readonly api_key?: string) {}

	async get_by_query(query: string) {
		try {
			const search_results = await api_get<TMDBMovieResponse>("https://api.themoviedb.org/3/search/movie", {
				page: 1,
				query: query,
				include_adult: true,
				api_key: this.api_key,
				language: this.get_language_by_(query),
			});
			if (!search_results?.total_results) return [];
			return search_results.results.map(result => this.create_movie_from_(result));
		} catch (error) {
			console.warn(error);
			throw error;
		}
	}

	create_movie_from_(result: Result): Movie {
		const movie: Movie = {
			title: result.title,
			poster_path: `https://image.tmdb.org/t/p/original${result.poster_path}`,
			vote_average: result.vote_average,
			release_date: result.release_date,
			overview: result.overview,
			adult: result.adult,
			popularity: result.popularity,
			original_title: result.original_title,
			original_language: result.original_language,
			id: result.id,
			genre_ids: result.genre_ids,
			vote_count: result.vote_count,
			video: result.video,
			backdrop_path: `https://image.tmdb.org/t/p/original${result.backdrop_path}`,
		};
		return movie;
	}

	get_language_by_(query: string): string {
		const detected = language_detector.detect(query, 3);
		if (detected.length) {
			return detected[0][0].slice(0, 2);
		}
		return "ru";
	}
}
