import { App, SuggestModal } from "obsidian";

export class LocaleSuggestModal extends SuggestModal<string> {
	constructor(
		app: App,
		private recent_locales: { [locale: string]: number },
		private onChoose: (error: Error | null, result?: string) => void,
	) {
		super(app);
	}

	getSuggestions(input: string): string[] {
		let all_locales = window.moment.locales().filter(locale => locale.includes(input.toLowerCase()));
		// Get recent locales that match the input
		const recent_locales = Object.keys(this.recent_locales).filter(locale => locale.includes(input.toLowerCase()));
		// Remove recent locales from all_locales
		all_locales = all_locales.filter(locale => !recent_locales.includes(locale));
		return [...recent_locales, ...all_locales];
	}

	renderSuggestion(locale: string, element: HTMLElement): void {
		const div = element.createEl("div", { text: locale });

		if (Object.keys(this.recent_locales).includes(locale)) {
			const span = div.createEl("span", { text: "Recenly used" });
			span.classList.add("movie-search-plugin__recent-locale");
		}
	}

	onChooseSuggestion(locale: string) {
		this.onChoose(null, locale);
	}
}
