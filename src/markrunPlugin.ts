import type { MarkdownIt } from "markdown-it";
import type { CppFile } from "./types.js";
import { parseInfoString } from "./parseFunction.js";
import type { MarkrunEnv } from "./types.js";

interface MarkrunTokenMeta extends Record<string, unknown> {
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

export function markrunPlugin(md: MarkdownIt): void {

    md.core.ruler.after("block", "markrun_collect_cpp", (state) => {
        const env = state.env as MarkrunEnv;
        env.markrun = { cppFiles: [] };

        state.tokens.forEach((token, index) => {
            const cppFile = getCppFile(token as FenceToken, index);
            if (!cppFile) {
                return;
            }

            const meta = (token.meta ?? {}) as MarkrunTokenMeta;
            meta.cppFile = cppFile;
            token.meta = meta;
            env.markrun!.cppFiles.push(cppFile)
        });
    });

    const defaultFenceRenderer = md.renderer.rules.fence;

    md.renderer.rules.fence = (tokens, index, options, env, self) => {
        const token = tokens[index];
        const meta = token.meta as MarkrunTokenMeta;
        const cppFile = meta?.cppFile;

        if (!cppFile || !defaultFenceRenderer) {
            return defaultFenceRenderer ? defaultFenceRenderer(tokens, index, options, env, self) : self.renderToken(tokens, index, options);
        }

        const originalCodeHtml = defaultFenceRenderer(tokens, index, options, env, self);

        const filename = md.utils.escapeHtml(cppFile.filename);
        const runButton = cppFile.isEntryPoint ? '<button class="markrun-run" type="button">Run Project</button>' : "";

        return `<section class="markrun-cell" data-cpp-id="${cppFile.id}">
                    <header class="markrun-cell-header">
                        <code>${filename}</code>
                        ${runButton}
                    </header>
                    ${originalCodeHtml}
                    ${cppFile.isEntryPoint ? '<pre class="markrun-output" hidden></pre>' : ""}
                </section>`;
    };
}