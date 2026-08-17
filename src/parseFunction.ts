import { CodeBlockMetadata } from "./types.js";

export function parseInfoString(info: String): CodeBlockMetadata {
	
	const trimmed = info.trim();

	const firstSpace = trimmed.indexOf(" ");

	if (firstSpace == -1) {
		return {
			language: trimmed
		};
	}

	const language = trimmed.slice(0, firstSpace);
	const attributes = trimmed.slice(firstSpace + 1);

	const filenameMatch = attributes.match(/filename="([^"]+)"/);
	const fileName = filenameMatch?.[1];

	return {
		language,
		filename: fileName
	};
}






