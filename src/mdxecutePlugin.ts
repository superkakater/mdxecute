import type { MarkdownIt } from "markdown-it";
import type { CppFile } from "./types.js";
import { parseInfoString } from "./parseFunction.js";
import type { MdxecuteEnv } from "./types.js";

interface MdxecuteTokenMeta extends Record<string, unknown> {
    cppFile?: CppFile;
}

interface FenceToken {
    type: string;
    info: string;
    content: string;
    meta: unknown;
}

function getCppFile(token: FenceToken, index: number): CppFile | undefined {

    if (token.type !== "fence") {
        return undefined;
    }

    const metadata = parseInfoString(token.info);

    if (!["cpp", "c++", "cxx", "cc"].includes(metadata.language ?? "") || !metadata.filename) {
        return undefined;
    }

    return {
        id: `cpp-block-${index}`,
        filename: metadata.filename,
        source: token.content,
        isEntryPoint: metadata.run === true || /(?:^|[\\/])main\.cpp$/.test(metadata.filename)
    };
}

export function mdxecutePlugin(md: MarkdownIt): void {

    md.core.ruler.after("block", "mdxecute_collect_cpp", (state) => {
        const env = state.env as MdxecuteEnv;
        env.mdxecute = { cppFiles: [] };

        state.tokens.forEach((token, index) => {
            const cppFile = getCppFile(token as FenceToken, index);
            if (!cppFile) {
                return;
            }

            const meta = (token.meta ?? {}) as MdxecuteTokenMeta;
            meta.cppFile = cppFile;
            token.meta = meta;
            env.mdxecute!.cppFiles.push(cppFile)
        });
    });

    const defaultFenceRenderer = md.renderer.rules.fence;

    md.renderer.rules.fence = (tokens, index, options, env, self) => {
        const token = tokens[index];
        const meta = token.meta as MdxecuteTokenMeta;
        const cppFile = meta?.cppFile;

        if (!cppFile || !defaultFenceRenderer) {
            return defaultFenceRenderer ? defaultFenceRenderer(tokens, index, options, env, self) : self.renderToken(tokens, index, options);
        }

        const originalCodeHtml = defaultFenceRenderer(tokens, index, options, env, self);

        const filename = md.utils.escapeHtml(cppFile.filename);
        const runButton = cppFile.isEntryPoint ? '<button class="mdxecute-run" type="button">Run Project</button>' : "";

        return `<section class="mdxecute-cell" data-cpp-id="${cppFile.id}">
                    <header class="mdxecute-cell-header">
                        <code>${filename}</code>
                        ${runButton}
                    </header>
                    ${originalCodeHtml}
                    ${cppFile.isEntryPoint ? '<pre class="mdxecute-output" hidden></pre>' : ""}
                </section>`;
    };
}
