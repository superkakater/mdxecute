#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { access } from "node:fs/promises";
import { startServer } from "./server.js";

interface PackageMetadata {
  version: string;
}

const packageMetadata = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8")
) as PackageMetadata

async function main(): Promise<void> {

  const argument = process.argv[2];

  if (argument == "--version" || argument == "-v") {
    console.log(`mdxecute ${packageMetadata.version}`);
    return;
  }


  if (argument === "--help" || argument === "-h") {
    console.log(`MDXecute ${packageMetadata.version}

Usage:
  mdxecute <file.md>
  mdxecute --version
  mdxecute --help`);
    return;
  }

  if (!argument) {
    console.error("Usage: mdxecute <file.md>");
    process.exitCode = 1;
    return;
  }

  try {
    await access(argument);
  } catch {
    console.error(`Markdown file does not exist: ${argument}`);
    process.exitCode = 1;
    return;
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
