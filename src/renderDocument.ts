import MarkdownIt from "markdown-it";
import taskLists from "markdown-it-task-lists";
import footnote from "markdown-it-footnote";
import mark from "markdown-it-mark";
import sub from "markdown-it-sub";
import sup from "markdown-it-sup";
import deflist from "markdown-it-deflist";
import { buildCppProject } from "./projectBuilder.js";
import type { CppProject, MdxecuteEnv } from "./types.js";
import { mdxecutePlugin } from "./mdxecutePlugin.js";

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

    md.use(taskLists);
    md.use(footnote);
    md.use(mark);
    md.use(sub);
    md.use(sup);
    md.use(deflist);
    md.use(mdxecutePlugin);

    const env: MdxecuteEnv = {};
    const html = md.render(source, env);
    const project = buildCppProject(env.mdxecute?.cppFiles ?? []);

    return {html, project};
}

