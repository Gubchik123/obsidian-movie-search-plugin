import { App, SuggestModal } from "obsidian";

export class LocaleSuggestModal extends SuggestModal<string> {
	constructor(app: App, private onChoose: (error: Error | null, result?: string) => void) {
		super(app);
	}

	getSuggestions(input: string): string[] {
		return window.moment.locales().filter(locale => locale.toLowerCase().includes(input.toLowerCase()));
	}

	renderSuggestion(locale: string, element: HTMLElement): void {
		element.createEl("div", { text: locale });
	}

	onChooseSuggestion(locale: string) {
		this.onChoose(null, locale);
	}
}
