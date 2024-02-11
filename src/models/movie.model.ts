export interface Frontmatter {
	[key: string]: string | string[];
}

export interface Movie {
	// Introduction
	title: string;
	poster_path: string;
	vote_average: number;
	release_date: string;
	// Summary
	overview: string;
	// Global Information
	adult: boolean;
	popularity: number;
	original_title: string;
	original_language: string;
	// TMDB information
	id: number;
	genre_ids: number[];
	vote_count: number;
	video: boolean;
	// Backdrop
	backdrop_path: string;
}
