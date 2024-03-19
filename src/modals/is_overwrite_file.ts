import { App } from "obsidian";

import { IsBoolModal } from "./is_bool";

export class IsOverwriteFileModal extends IsBoolModal {
	resolve: ((value: boolean) => void) | null = null;

	constructor(app: App, file_name: string) {
		super(app, `File ${file_name} already exists. Do you want to overwrite it?`, "Yes, overwrite", "No, cancel");
	}
}
