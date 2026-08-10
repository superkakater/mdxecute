import { FenceMetadata } from './fence-metadata.ts';

function parseInfoString(info: String): FenceMetadata {
	
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
	const whetherRun = fileName == "main.cpp" ? true : false;

	return {
		language,
		filename: fileName,
		run: whetherRun
	};
}

const test: FenceMetadata = parseInfoString('cpp {filename="math.cpp"}');

console.log(test);






