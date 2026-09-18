import type { CodeBlockMetadata } from "./types.js";

export function parseInfoString(info: string): CodeBlockMetadata {
    const match = info.trim().match(/^(\S+?)(?=\s|\{|$)([\s\S]*)$/);
    const attributes = match?.[2] ?? "";
    const filenameMatch = attributes.match(/\bfilename\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s}]+))/);
    const flags = attributes.replace(/\bfilename\s*=\s*(?:"[^"]*"|'[^']*'|[^\s}]+)/g, " ");

    return {
        language: match?.[1].toLowerCase(),
        filename: filenameMatch?.[1] ?? filenameMatch?.[2] ?? filenameMatch?.[3],
        run: /(?:^|[\s{])run(?=$|[\s}])/.test(flags)
    };
}
