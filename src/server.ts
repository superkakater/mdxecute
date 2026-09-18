import { createServer, type Server, type ServerResponse } from "node:http";
import { readFile, realpath } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { compileAndRun } from "./compiler.js";
import { renderDocument } from "./renderDocument.js";
import { createPage } from "./pageCreation.js";

async function loadMarkdown(markdownPath: string) {
    const source = await readFile(markdownPath, "utf8");
    return {
        ...renderDocument(source),
        version: createHash("sha256").update(source).digest("hex")
    };
}

function sendJson(response: ServerResponse, status: number, text: string): void {
    response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
    response.end(text);
}

function sendText(response: ServerResponse, status: number, text: string): void {
    response.writeHead(status, { "content-type": "text/plain; charset=utf-8" });
    response.end(text);
}

export async function startServer(markdownPath: string, port = 4280): Promise<Server> {
    const absoluteMarkdownPath = await realpath(path.resolve(markdownPath));
    const directory = path.dirname(absoluteMarkdownPath);
    let running = false;
    const imageTypes: Record<string, string> = {
        ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".gif": "image/gif", ".webp": "image/webp", ".svg": "image/svg+xml",
        ".avif": "image/avif", ".ico": "image/x-icon"
    };

    const server = createServer(async (request, response) => {
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("X-Content-Type-Options", "nosniff");
        const address = server.address();
        const currentPort = typeof address === "object" && address ? address.port : port;
        const allowedHosts = [`localhost:${currentPort}`, `127.0.0.1:${currentPort}`];
        if (!allowedHosts.includes(request.headers.host ?? "")) {
            sendText(response, 403, "Invalid host");
            return;
        }

        try {
            const url = new URL(request.url ?? "/", `http://localhost:${currentPort}`);
            if (request.method === "GET" && url.pathname === "/") {
                const rendered = await loadMarkdown(absoluteMarkdownPath);
                response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
                response.end(createPage(path.basename(absoluteMarkdownPath), rendered.html, rendered.version));
                return;
            }

            if (request.method === "GET" && url.pathname === "/api/document") {
                const rendered = await loadMarkdown(absoluteMarkdownPath);
                sendJson(response, 200, JSON.stringify({
                    version: rendered.version,
                    html: url.searchParams.get("version") === rendered.version ? undefined : rendered.html
                }));
                return;
            }

            if (request.method === "POST" && url.pathname === "/api/run") {
                if (request.headers["x-markrun-request"] !== "run" ||
                    (request.headers.origin && !allowedHosts.some((host) => request.headers.origin === `http://${host}`))) {
                    sendJson(response, 403, JSON.stringify({ error: "Run requests must come from the MarkRun preview." }));
                    return;
                }
                if (running) {
                    sendJson(response, 409, JSON.stringify({ error: "A project is already running. Try again when it finishes." }));
                    return;
                }
                running = true;
                try {
                    const rendered = await loadMarkdown(absoluteMarkdownPath);
                    if (request.headers["x-markrun-version"] !== rendered.version) {
                        sendJson(response, 409, JSON.stringify({ error: "The Markdown changed. Wait for the preview to update and run again." }));
                        return;
                    }
                    sendJson(response, 200, JSON.stringify(await compileAndRun(rendered.project)));
                } finally {
                    running = false;
                }
                return;
            }

            if (request.method === "GET" && imageTypes[path.extname(url.pathname).toLowerCase()]) {
                const filename = await realpath(path.resolve(directory, "." + decodeURIComponent(url.pathname)));
                const relative = path.relative(directory, filename);
                if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
                    sendText(response, 403, "Image is outside the Markdown directory.");
                    return;
                }
                const content = await readFile(filename);
                response.setHeader("Content-Security-Policy", "sandbox");
                response.writeHead(200, { "content-type": imageTypes[path.extname(filename).toLowerCase()] ?? "application/octet-stream" });
                response.end(content);
                return;
            }

            sendText(response, 404, "Not found");
        } catch (error) {
            const status = (error as NodeJS.ErrnoException).code === "ENOENT" ? 404 : 500;
            sendJson(response, status, JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
        }
    });

    await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "127.0.0.1", () => {
            server.off("error", reject);
            resolve();
        });
    });
    const address = server.address();
    console.log(`MarkRun preview: http://localhost:${typeof address === "object" && address ? address.port : port}`);
    console.log(`Markdown: ${absoluteMarkdownPath}`);
    console.log("Live preview updates on save. Press Ctrl+C to stop.");
    return server;
}
