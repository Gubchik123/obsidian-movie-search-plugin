export interface Frontmatter {
	[key: string]: string | string[];
}

export interface MovieSearch {
	id: number;
	media_type: string;
	original_title: string;
	release_date: string;
	title: string;
	poster_path: string;
}

export interface Movie {
	adult: boolean;
	backdrop_path: string;
	main_actors: string[];
	media_type: string;
	director: string;
	genres: string[];
	homepage: string;
	id: number;
	original_language: string;
	original_title: string;
	overview: string;
	popularity: number;
	poster_path: string;
	production_companies: string[];
	production_countries: string[];
	release_date: string;
	runtime: number;
	spoken_languages: string[];
	tagline: string;
	title: string;
	vote_average: number;
	vote_count: number;
	youtube_url: string;
}
