export interface TMDBMovieResponse {
	page: number;
	results: Result[];
	total_pages: number;
	total_results: number;
}

export interface Result {
	media_type: string;
	adult: boolean;
	backdrop_path: string;
	genre_ids: number[];
	id: number;
	original_language: string;
	original_title: string;
	// OR
	original_name: string;
	overview: string;
	popularity: number;
	poster_path: string;
	// OR
	profile_path: string;
	release_date: string;
	// OR
	first_air_date: string;
	title: string;
	// OR
	name: string;
	video: boolean;
	vote_average: number;
	vote_count: number;
}
