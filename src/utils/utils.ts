import { parseYaml } from "obsidian";
import { DefaultFrontmatterKeyType } from "@settings/settings";
import { Frontmatter, Movie } from "@models/movie.model";

export const NUMBER_REGEX = /^-?[0-9]*$/;
export const DATE_REGEX = /{{DATE(\+-?[0-9]+)?}}/;
export const DATE_REGEX_FORMATTED = /{{DATE:([^}\n\r+]*)(\+-?[0-9]+)?}}/;

export function replace_illegal_file_name_characters_in_(text: string) {
	return text.replace(/[\\*<>":?]/g, "").replace(/\s+/g, " ");
}

export function make_file_name_for_(movie: Movie, file_name_format?: string) {
	let result: string = movie.title;
	if (file_name_format) result = replace_variable_syntax(movie, replace_date_in_(file_name_format));
	return replace_illegal_file_name_characters_in_(result) + ".md";
}

export function make_folder_path_for_(movie: Movie, folder_path: string) {
	const result: string = replace_variable_syntax(movie, folder_path);
	return replace_illegal_file_name_characters_in_(result);
}

export function change_snake_case(movie: Movie) {
	return Object.entries(movie).reduce((acc, [key, value]) => {
		acc[camel_to_snake_case(key)] = value;
		return acc;
	}, {});
}

export function apply_default_frontmatter(
	movie: Movie,
	frontmatter: Frontmatter | string,
	key_type: DefaultFrontmatterKeyType = DefaultFrontmatterKeyType.snake_case,
) {
	const _frontmatter = key_type === DefaultFrontmatterKeyType.camel_case ? movie : change_snake_case(movie);
	const extra_front_matter = typeof frontmatter === "string" ? parseYaml(frontmatter) : frontmatter;

	for (const key in extra_front_matter) {
		const value = extra_front_matter[key]?.toString().trim() ?? "";
		_frontmatter[key] = _frontmatter[key] && _frontmatter[key] !== value ? `${_frontmatter[key]}, ${value}` : value;
	}
	return _frontmatter as object;
}

export function replace_variable_syntax(movie: Movie, text: string): string {
	if (!text?.trim()) return "";

	const entries = Object.entries(movie);

	return entries
		.reduce((result, [key, val = ""]) => {
			return result.replace(new RegExp(`{{${key}}}`, "ig"), val);
		}, text)
		.replace(/{{\w+}}/gi, "")
		.trim();
}

export function camel_to_snake_case(str: string) {
	return str.replace(/[A-Z]/g, letter => `_${letter?.toLowerCase()}`);
}

export function getDate(input?: { format?: string; offset?: number }) {
	let duration: moment.Duration;

	if (input?.offset !== null && input?.offset !== undefined && typeof input.offset === "number")
		duration = window.moment.duration(input.offset, "days");

	return input?.format
		? window.moment().add(duration).format(input?.format)
		: window.moment().add(duration).format("YYYY-MM-DD");
}

export function replace_date_in_(input: string) {
	let output: string = input;

	while (DATE_REGEX.test(output)) {
		const date_match = DATE_REGEX.exec(output);
		let offset = 0;

		if (date_match?.[1]) {
			const offset_string = date_match[1].replace("+", "").trim();
			const is_offset_int = NUMBER_REGEX.test(offset_string);
			if (is_offset_int) offset = parseInt(offset_string);
		}
		output = replacer(output, DATE_REGEX, getDate({ offset }));
	}

	while (DATE_REGEX_FORMATTED.test(output)) {
		const date_match = DATE_REGEX_FORMATTED.exec(output);
		const format = date_match?.[1];
		let offset = 0;

		if (date_match?.[2]) {
			const offset_string = date_match[2].replace("+", "").trim();
			const is_offset_int = NUMBER_REGEX.test(offset_string);
			if (is_offset_int) offset = parseInt(offset_string);
		}
		output = replacer(output, DATE_REGEX_FORMATTED, getDate({ format, offset }));
	}
	return output;
}

export function is_entry_in_template(entry_name: string, template_text: string): boolean{
	const regex = new RegExp(`{{\\s*${entry_name}\\s*}}`, "i");
	return regex.test(template_text);
}

function replacer(str: string, reg: RegExp, replace_value: string) {
	return str.replace(reg, function () {
		return replace_value;
	});
}
