import { App, MarkdownView } from "obsidian";

export class CursorJumper {
	constructor(private app: App) {}

	async jump_to_next_cursor_location(): Promise<void> {
		const active_view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!active_view) return;

		const content = await this.app.vault.cachedRead(active_view.file);
		const index_offset = content.length + 1;
		const editor = active_view.editor;
		editor.focus();
		editor.setCursor(index_offset, 0);
	}
}
