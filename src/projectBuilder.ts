import path from "node:path";
import type { CppFile, CppProject } from "./types.js";

function validateFilename(filename: string): void {

    if (!filename.trim()) {
        throw new Error("C++ block has an empty filename.");
    }

    if (path.isAbsolute(filename)) {
        throw new Error(`Absolute paths are not allowed: ${filename}`);
    }

    const normalized = path.posix.normalize(filename.replaceAll("\\", "/"));
    if (normalized === ".." || normalized.startsWith("../")) {
        throw new Error(`Path traversal is not allowed: ${filename}`);
    }
}

export function buildCppProject(files: CppFile[]): CppProject {

    const seen = new Set<String>();

    for (const file of files) {
        validateFilename(file.filename);

        if (seen.has(file.filename)) {
            throw new Error(`Duplicate C++ filename in Markdown: ${file.filename}`);
        }

        seen.add(file.filename);
    }

    const entryPoint = files.filter((file) => file.isEntryPoint);
    if (entryPoint.length > 1) {
        throw new Error("Multiple main.cpp blocks were found");
    }

    return {
        files,
        entryPoint: entryPoint[0]
    };
}