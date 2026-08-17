export function createPage(title: string, markdownHtml: string): string {
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
  <title>${safeTitle} - MarkRun</title>
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
    .markrun-cell {
      border: 1px solid color-mix(in srgb, CanvasText 22%, transparent);
      border-radius: 10px;
      overflow: hidden;
      margin: 20px 0;
    }
    .markrun-cell > pre {
      margin: 0;
      border-radius: 0;
    }
    .markrun-cell-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 8px 12px;
      border-bottom: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
      background: color-mix(in srgb, CanvasText 5%, Canvas);
    }
    .markrun-run {
      cursor: pointer;
      padding: 5px 12px;
    }
    .markrun-output {
      margin: 0;
      border-radius: 0;
      border-top: 1px solid color-mix(in srgb, CanvasText 18%, transparent);
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  ${markdownHtml}
  <script>
    document.addEventListener("click", async (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement) || !target.classList.contains("markrun-run")) {
        return;
      }

      const cell = target.closest(".markrun-cell");
      const output = cell?.querySelector(".markrun-output");
      if (!(output instanceof HTMLElement)) {
        return;
      }

      target.disabled = true;
      output.hidden = false;
      output.textContent = "Compiling...";

      try {
        const response = await fetch("/api/run", { method: "POST" });
        const result = await response.json();

        if (!response.ok) {
          output.textContent = result.error ?? "MarkRun failed.";
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
      }
    });
  </script>
</body>
</html>`;
}
