import { createServer, Server, type ServerResponse } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { compileAndRun } from "./compiler.js";
import { renderDocument } from "./renderDocument.js";
import { createPage } from "./pageCreation.js";

async function loadMarkdown(markdownPath: string) {

    const source = await readFile(markdownPath, "utf8");
    return renderDocument(source);
}

function sendJson(response: ServerResponse, status: number, text: string): void {

    response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
    response.end(text);
}

function sendText(response: ServerResponse, status: number, text: string): void {

    response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
    response.end(text);
}

export async function startServer(markdownPath: string, port = 4280): Promise<void> {

    const absoluteMarkdownPath = path.resolve(markdownPath);

    const server = createServer(async (request, response) => {

        const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

        if (request.method === "GET" && url.pathname === "/") {
            try {
                const rendered = await loadMarkdown(absoluteMarkdownPath);
                response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                response.end(createPage(path.basename(absoluteMarkdownPath), rendered.html));
            } catch (error) {
                sendText(response, 500, error instanceof Error ? error.stack ?? error.message : String(error));
            }
            return;
        }

        sendText(response, 404, "Not found");
    });

    server.listen(port, "localhost", () => {
        console.log(`MarkRun preview: http://localhost:${port}`);
        console.log(`Markdown: ${absoluteMarkdownPath}`);
        console.log("Press ctrl + c to stop.");
    });
}