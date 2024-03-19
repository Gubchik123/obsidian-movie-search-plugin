import { App } from "obsidian";

import { IsBoolModal } from "./is_bool";

export class IsCreateAllMoviePartsModal extends IsBoolModal {
	resolve: ((value: boolean) => void) | null = null;

	constructor(app: App, movie_title: string, count: number) {
		super(
			app,
			`There are ${count} parts of the "${movie_title}". Do you want to create notes for all of them?`,
			"Yes, create",
			"No, look at the search results",
		);
	}
}
