import { App, normalizePath, Notice, TFile } from "obsidian";
import { Movie } from "@models/movie.model";

export async function get_template_contents(app: App, template_path: string | undefined): Promise<string> {
	const { metadataCache, vault } = app;
	const normalized_template_path = normalizePath(template_path ?? "");
	if (template_path === "/") return Promise.resolve("");

	try {
		const template_file = metadataCache.getFirstLinkpathDest(normalized_template_path, "");
		return template_file ? vault.cachedRead(template_file) : "";
	} catch (err) {
		console.error(`Failed to read the daily note template '${normalized_template_path}'`, err);
		new Notice("Failed to read the daily note template");
		return "";
	}
}

export function apply_template_transformations(raw_template_contents: string): string {
	return raw_template_contents.replace(
		/{{\s*(date|time)\s*(([+-]\d+)([yqmwdhs]))?\s*(:.+?)?}}/gi,
		(_, _time_or_date, calc, time_delta, unit, moment_format) => {
			const now = window.moment();
			const current_date = window
				.moment()
				.clone()
				.set({
					hour: now.get("hour"),
					minute: now.get("minute"),
					second: now.get("second"),
				});
			if (calc) current_date.add(parseInt(time_delta, 10), unit);

			if (moment_format) return current_date.format(moment_format.substring(1).trim());
			return current_date.format("YYYY-MM-DD");
		},
	);
}

export function execute_inline_scripts_template(movie: Movie, text: string) {
	const command_regex = /<%(?:=)(.+)%>/g;
	const ctor = get_function_constructor();
	const matched_list = [...text.matchAll(command_regex)];
	return matched_list.reduce((result, [matched, script]) => {
		try {
			const outputs = new ctor(
				[
					"const [movie] = arguments",
					`const output = ${script}`,
					'if(typeof output === "string") return output',
					"return JSON.stringify(output)",
				].join(";"),
			)(movie);
			return result.replace(matched, outputs);
		} catch (err) {
			console.warn(err);
		}
		return result;
	}, text);
}

export function get_function_constructor(): typeof Function {
	try {
		return new Function("return (function(){}).constructor")();
	} catch (err) {
		console.warn(err);
		if (err instanceof SyntaxError) throw Error("Bad template syntax");
		else throw err;
	}
}

export async function use_templater_plugin_in_file(app: App, file: TFile) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const templater = (app as any).plugins.plugins["templater-obsidian"];
	if (templater && !templater?.settings["trigger_on_file_creation"])
		await templater.templater.overwrite_file_commands(file);
}
