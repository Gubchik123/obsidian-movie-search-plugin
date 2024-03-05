import LanguageDetect from "languagedetect";

import { MovieSearch, Movie } from "@models/movie.model";
import { api_get, BaseMoviesAPI } from "@apis/base_api";
import { TMDBMovieSearchResponse, TMDBMovieSearchResult, TMDBMovieResponse } from "./models/tmdb_movies_response";

let language: string;
const language_detector = new LanguageDetect();

export class TMDBMoviesAPI implements BaseMoviesAPI {
	constructor(
		private readonly api_key?: string,
		private readonly include_adult?: boolean,
		private readonly locale_preference?: string,
	) {}

	async get_movies_by_(query: string) {
		try {
			language = this.locale_preference === "auto" ? this.get_language_by_(query) : this.locale_preference;

			const params = {
				page: 1,
				query: query,
				include_adult: this.include_adult,
				language: language,
			};
			const headers = {};
			// If the given API key is JWT
			if (this.api_key.length > 32) {
				const splited_api_key = this.api_key.split(" ");
				headers["Authorization"] =
					splited_api_key.length > 1
						? `Bearer ${splited_api_key[splited_api_key.length - 1]}`
						: `Bearer ${this.api_key}`;
			} else params["api_key"] = this.api_key;

			const search_results = await api_get<TMDBMovieSearchResponse>(
				"https://api.themoviedb.org/3/search/multi",
				params,
				headers,
			);
			if (!search_results?.total_results) return [];
			return search_results.results
				.filter(result => result.media_type === "movie" || result.media_type === "tv")
				.map(result => this.create_movie_search_from_(result));
		} catch (error) {
			console.warn(error);
			throw error;
		}
	}

	async get_movie_by_(id: number, media_type: string) {
		try {
			const params = {
				append_to_response: "credits",
				language: language,
			};
			const headers = {};
			// If the given API key is JWT
			if (this.api_key.length > 32) {
				const splited_api_key = this.api_key.split(" ");
				headers["Authorization"] =
					splited_api_key.length > 1
						? `Bearer ${splited_api_key[splited_api_key.length - 1]}`
						: `Bearer ${this.api_key}`;
			} else params["api_key"] = this.api_key;

			const movie = await api_get<TMDBMovieResponse>(
				`https://api.themoviedb.org/3/${this.convert_to_lower_case(media_type)}/${id}`,
				params,
				headers,
			);
			return this.create_movie_from_(movie, media_type);
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

	convert_to_lower_case(media_type: string): string {
		return media_type === "Movie" ? "movie" : "tv";
	}

	create_movie_search_from_(result: TMDBMovieSearchResult): MovieSearch {
		const movie_search: MovieSearch = {
			id: result.id,
			title: result.title || result.name,
			release_date: result.release_date || result.first_air_date,
			original_title: result.original_title || result.original_name,
			media_type: this.convert_to_title_case(result.media_type),
		};
		return movie_search;
	}

	convert_to_title_case(media_type: string): string {
		return media_type === "movie" ? "Movie" : "TV";
	}

	create_movie_from_(response: TMDBMovieResponse, media_type: string): Movie {
		const movie: Movie = {
			adult: response.adult,
			backdrop_path: `https://image.tmdb.org/t/p/original${response.backdrop_path}`,
			main_actors: response.credits.cast.map(actor => `${actor.name} (${actor.character})`).slice(0, 10),
			media_type: media_type,
			director: response.credits.crew.find(crew => crew.job === "Director")?.name,
			genres: response.genres.map(genre => genre.name),
			homepage: response.homepage,
			id: response.id,
			original_language: response.original_language,
			original_title: response.original_title || response.original_name,
			overview: response.overview,
			popularity: response.popularity,
			poster_path: `https://image.tmdb.org/t/p/original${response.poster_path}`,
			production_companies: response.production_companies.map(
				company => `${company.name} (${company.origin_country})`,
			),
			production_countries: response.production_countries.map(
				country => `${country.name} (${country.iso_3166_1})`,
			),
			release_date: response.release_date || response.first_air_date,
			spoken_languages: response.spoken_languages.map(language => `${language.name} (${language.iso_639_1})`),
			tagline: response.tagline,
			title: response.title || response.name,
			vote_average: response.vote_average,
			vote_count: response.vote_count,
		};
		return movie;
	}
}
