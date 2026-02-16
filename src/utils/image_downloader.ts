import { DownloadedImage } from "@models/downloaded_image.model";
import { App, normalizePath, requestUrl } from "obsidian";

export async function download_image(image_url: string, file_name: string): Promise<DownloadedImage | null> {
	try {
		const res = await requestUrl({
			url: image_url,
			method: "GET",
		});

		return {
			content: res.arrayBuffer,
			file_name: file_name,
			extension: get_extension(image_url),
		};
	} catch (e) {
		console.warn("Failed to download image", e);
		return null;
	}
}

function get_extension(url: string): string {
	const clean = url.split("?")[0].split("#")[0];

	const lastDot = clean.lastIndexOf(".");
	if (lastDot === -1) {
		return "jpg";
	}

	return clean.substring(lastDot + 1);
}

export async function save_to_folder(app: App, folder_path: string, image: DownloadedImage) {
	const targetFolder = normalizePath(folder_path.trim());

	if (targetFolder && !(await app.vault.adapter.exists(targetFolder))) {
		await app.vault.createFolder(targetFolder);
	}

	image.file_name = await unique_file_name(app, targetFolder, image.file_name, image.extension);

	const fullPath = normalizePath(`${targetFolder}/${image.file_name}.${image.extension}`);
	await app.vault.createBinary(fullPath, image.content);
}

async function unique_file_name(app: App, folder: string, file_name: string, extension: string): Promise<string> {
	let candidate = file_name;
	let i = 1;

	while (await app.vault.adapter.exists(normalizePath(`${folder}/${candidate}.${extension}`))) {
		candidate = `${file_name}_${i}`;
		i++;
	}

	return candidate;
}
