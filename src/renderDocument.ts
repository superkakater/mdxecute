import MarkdownIt from "markdown-it";
import { buildCppProject } from "./projectBuilder.js";
import type { CppProject, MarkrunEnv } from "./types.js";
import { markrunPlugin } from "./markrunPlugin.js";

export interface RenderedDocument {
    html: string;
    project: CppProject;
}

export function renderDocument(source: string): RenderedDocument {

    const md = new MarkdownIt({
        html: false,
        linkify: true,
        typographer: false
    });

    md.use(markrunPlugin);

    const env: MarkrunEnv = {};
    const html = md.render(source, env as any);
    const project = buildCppProject(env.markrun?.cppFiles ?? []);

    return {html, project};
}

