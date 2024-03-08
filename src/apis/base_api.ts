import { requestUrl } from "obsidian";
import { ServiceProvider } from "@src/constants";
import { MovieSearch, Movie } from "@models/movie.model";
import { MovieSearchPluginSettings } from "@settings/settings";
import { TMDBMoviesAPI } from "./tmdb_movies_api";

export interface BaseMoviesAPI {
	get_movies_by_(query: string): Promise<MovieSearch[]>;
	get_movie_by_(id: number, media_type: string): Promise<Movie>;
}

export function get_service_provider(settings: MovieSearchPluginSettings): BaseMoviesAPI {
	if (settings.service_provider === ServiceProvider.tmdb) {
		if (!settings.api_key) throw new Error("TMDB API key is required!"); // TODO: Create a custom error class
		return new TMDBMoviesAPI(settings.api_key, settings.include_adult, settings.locale_preference);
	}
}

export async function api_get<T>(
	url: string,
	params: Record<string, string | number | boolean> = {},
	headers?: Record<string, string>,
): Promise<T> {
	const api_URL = new URL(url);
	Object.entries(params).forEach(([key, value]) => {
		api_URL.searchParams.append(key, value?.toString());
	});
	const result = await requestUrl({
		url: api_URL.href,
		method: "GET",
		headers: {
			Accept: "*/*",
			"Content-Type": "application/json; charset=utf-8",
			...headers,
		},
	});
	return result.json as T;
}
