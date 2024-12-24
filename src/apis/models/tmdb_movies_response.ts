export interface TMDBMovieSearchResponse {
	page: number;
	results: TMDBMovieSearchResult[];
	total_pages: number;
	total_results: number;
}

export interface TMDBMovieSearchResult {
	id: number;
	media_type: string;
	original_title: string;
	// OR
	original_name: string;
	release_date: string;
	// OR
	first_air_date: string;
	title: string;
	// OR
	name: string;
	poster_path: string;
}

export interface TMDBMovieResponse {
	adult: boolean;
	backdrop_path: string;
	credits: {
		cast: Actor[];
		crew: Director[];
	};
	genres: Genre[];
	homepage: string;
	id: number;
	original_language: string;
	original_title: string;
	// OR
	original_name: string;
	overview: string;
	popularity: number;
	poster_path: string;
	production_companies: ProductionCompany[];
	production_countries: ProductionCountry[];
	release_date: string;
	// OR
	first_air_date: string;
	runtime: number;
	// OR
	episode_run_time: number[];
	spoken_languages: SpokenLanguage[];
	tagline: string;
	title: string;
	// OR
	name: string;
	vote_average: number;
	vote_count: number;
	videos: {
		results: Video[];
	};
}

interface Actor {
	name: string;
	character: string;
}

interface Director {
	name: string;
	job: string;
}

interface Genre {
	name: string;
}

interface ProductionCompany {
	name: string;
	origin_country: string;
}

interface ProductionCountry {
	name: string;
	iso_3166_1: string;
}

interface SpokenLanguage {
	iso_639_1: string;
	name: string;
}

export interface Video {
	name: string;
	key: string;
	site: string;
	type: string;
}
