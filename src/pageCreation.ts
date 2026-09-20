export function createPage(title: string, markdownHtml: string, version = ""): string {
  const safeTitle = title
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle} - MDXecute</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      max-width: 900px;
      margin: 0 auto;
      padding: 32px 24px 80px;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
    }
    pre {
      overflow-x: auto;
      padding: 16px;
      border-radius: 8px;
      background: color-mix(in srgb, CanvasText 8%, Canvas);
    }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
    .mdxecute-cell {
      border: 1px solid color-mix(in srgb, CanvasText 22%, transparent);
      border-radius: 10px;
      overflow: hidden;
      margin: 20px 0;
    }
    .mdxecute-cell > pre {
      margin: 0;
      border-radius: 0;
    }
    .mdxecute-cell-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 8px 12px;
      border-bottom: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
      background: color-mix(in srgb, CanvasText 5%, Canvas);
    }
    .mdxecute-run {
      cursor: pointer;
      padding: 5px 12px;
    }
    .mdxecute-output {
      margin: 0;
      border-radius: 0;
      border-top: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
      white-space: pre-wrap;
    }
    table { border-collapse: collapse; display: block; overflow-x: auto; margin: 16px 0; }
    th, td { border: 1px solid color-mix(in srgb, CanvasText 25%, transparent); padding: 8px 12px; }
    th { background: color-mix(in srgb, CanvasText 8%, Canvas); }
    blockquote { border-left: 4px solid #6b8afd; margin-left: 0; padding-left: 16px; }
    img { max-width: 100%; height: auto; }
    .task-list-item { list-style: none; }
    .task-list-item-checkbox { margin-right: 8px; }
    mark { background: #ffe58a; color: #222; padding: 0 2px; }
    dt { font-weight: bold; }
    .footnotes { font-size: 0.9em; }
    #mdxecute-status { font-size: 0.85em; opacity: 0.75; }
  </style>
</head>
<body>
  <div id="mdxecute-status" role="status">Live preview · updates on save</div>
  <main id="mdxecute-document">${markdownHtml}</main>
  <script>
    let version = ${JSON.stringify(version).replace('<', '\u003c')};
    let activeRuns = 0;
    const preview = document.getElementById("mdxecute-document");
    const status = document.getElementById("mdxecute-status");

    async function refreshPreview() {
      try {
        if (activeRuns > 0) return;
        const response = await fetch("/api/document?version=" + encodeURIComponent(version));
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Preview update failed.");
        if (activeRuns > 0) return;
        if (typeof result.html === "string") {
          const scrollY = window.scrollY;
          preview.innerHTML = result.html;
          version = result.version;
          window.scrollTo(0, scrollY);
        }
        status.textContent = "Live preview · updates on save";
      } catch (error) {
        status.textContent = "Preview: " + (error instanceof Error ? error.message : String(error)) + " · retrying";
      } finally {
        setTimeout(refreshPreview, 750);
      }
    }
    setTimeout(refreshPreview, 750);

    document.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement) || !target.classList.contains("mdxecute-run")) {
        return;
      }

      const cell = target.closest(".mdxecute-cell");
      const output = cell?.querySelector(".mdxecute-output");
      if (!(output instanceof HTMLElement)) {
        return;
      }

      activeRuns += 1;
      target.disabled = true;
      output.hidden = false;
      output.textContent = "Compiling...";

      try {
        const response = await fetch("/api/run", { method: "POST", headers: { "X-MDXecute-Request": "run", "X-MDXecute-Version": version } });
        const result = await response.json();

        if (!response.ok) {
          output.textContent = result.error ?? "MDXecute failed.";
          return;
        }

        const sections = [];
        sections.push(result.compileSucceeded ? "Compile: success" : "Compile: failed");
        sections.push("Exit code: " + String(result.exitCode));
        sections.push("Duration: " + result.durationMs + " ms");

        if (result.timedOut) sections.push("Timed out: yes");
        if (result.stdout) sections.push("\\nstdout:\\n" + result.stdout);
        if (result.stderr) sections.push("\\nstderr:\\n" + result.stderr);

        output.textContent = sections.join("\\n");
      } catch (error) {
        output.textContent = error instanceof Error ? error.message : String(error);
      } finally {
        target.disabled = false;
        activeRuns -= 1;
      }
    });
  </script>
</body>
</html>`;
}
