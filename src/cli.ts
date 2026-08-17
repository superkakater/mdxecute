#!/usr/bin/env node
import { access } from "node:fs/promises";
import { startServer } from "./server.js";

async function main(): Promise<void> {

    const markdownPath = process.argv[2];

    if (!markdownPath) {
        console.error("Usage: markrun <file.md>");
        process.exitCode = 1;
        return;
    }

    try {
        await access(markdownPath);
    } catch {
        console.error(`Markdown file does not exist: ${markdownPath}`);
        process.exitCode = 1;
        return;
    }

    await startServer(markdownPath);
}

void main();