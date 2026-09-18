import path from "node:path";
import type { CppFile, CppProject } from "./types.js";

function validateFilename(filename: string): void {

    if (!filename.trim()) {
        throw new Error("C++ block has an empty filename.");
    }

    if (path.posix.isAbsolute(filename) || path.win32.isAbsolute(filename) || /^[a-z]:/i.test(filename)) {
        throw new Error(`Absolute paths are not allowed: ${filename}`);
    }

    const normalized = path.posix.normalize(filename.replaceAll("\\", "/"));
    if (normalized === ".." || normalized.startsWith("../") || normalized === "." || /[\x00-\x1f]/.test(filename)) {
        throw new Error(`Path traversal is not allowed: ${filename}`);
    }
}

export function buildCppProject(files: CppFile[]): CppProject {

    const seen = new Set<string>();

    files = files.map((file) => {
        validateFilename(file.filename);
        return { ...file, filename: path.posix.normalize(file.filename.replaceAll("\\", "/")) };
    });

    for (const file of files) {
        if (seen.has(file.filename)) {
            throw new Error(`Duplicate C++ filename in Markdown: ${file.filename}`);
        }

        seen.add(file.filename);
    }

    const entryPoint = files.filter((file) => file.isEntryPoint);
    if (entryPoint.length > 1) {
        throw new Error("Multiple entry points were found. Use one main.cpp or one run block per document.");
    }

    return {
        files,
        entryPoint: entryPoint[0]
    };
}