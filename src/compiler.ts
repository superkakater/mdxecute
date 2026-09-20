import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import type { CompileRunResult, CppProject } from "./types.js";

interface ProcessResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timeOut: boolean;
}

function execute(executable: string, args: string[], cwd: string, timeoutMs: number): Promise<ProcessResult> {

    return new Promise((resolve) => {
        const child = execFile(
            executable,
            args,
            {
                cwd,
                timeout: timeoutMs,
                maxBuffer: 1024 * 1024,
                windowsHide: true,
                killSignal: "SIGKILL"
            },
            (error, stdout, stderr) => {
                if (!error) {
                    resolve({stdout, stderr, exitCode: 0, timeOut: false});
                    return;
                }

                const errorWithCode = error as Omit<NodeJS.ErrnoException, "code"> & {
                    code?: string | number;
                    killed?: boolean;
                    signal?: NodeJS.Signals;
                };

                if (errorWithCode.code === "ENOENT") {
                    resolve({stdout, stderr: `${stderr}${stderr ? "\n" : ""}Could not find executable: ${executable}`, exitCode: null, timeOut: false});
                    return;
                }

                resolve({stdout, stderr: stderr || error.message, exitCode: typeof errorWithCode.code === "number" ? errorWithCode.code : null, timeOut: Boolean(errorWithCode.killed) && errorWithCode.code !== "ERR_CHILD_PROCESS_STDIO_MAXBUFFER"})
            }
        );
        child.stdin?.end();
    })
}

async function writeProject(project: CppProject, directory: string): Promise<void> {

    for (const file of project.files) {
        const target = path.join(directory, file.filename);
        await mkdir(path.dirname(target), {recursive: true});
        await writeFile(target, file.source, "utf8");
    }
}

export async function compileAndRun(project: CppProject): Promise<CompileRunResult> {

    const startedAt = performance.now();

    if (!project.entryPoint) {
        return {compileSucceeded: false, stdout: "", stderr: "No entry point found. Name a block main.cpp or add the run flag.", exitCode: null, timedOut: false, durationMs: 0}
    }

    const directory = await mkdtemp(path.join(tmpdir(), "mdxecute-"));

    try {
        await writeProject(project, directory);
        const cppSources = project.files
            .map((file) => file.filename)
            .filter((filename) => /\.(?:cpp|cc|cxx)$/i.test(filename))
            .map((filename) => `./${filename}`);

        if (cppSources.length === 0) {
            throw new Error("No C++ source files were found");
        }

        const outputName = process.platform === "win32" ? ".mdxecute-program.exe" : ".mdxecute-program";

        const compileResult = await execute(
            "g++",
            ["-std=c++20", "-Wall", "-Wextra", "-I.", ...cppSources, "-o", outputName],
            directory,
            10_000
        );

        if (compileResult.exitCode !== 0) {
            return {
                compileSucceeded: false,
                stdout: compileResult.stdout,
                stderr: compileResult.stderr,
                exitCode: compileResult.exitCode,
                timedOut: compileResult.timeOut,
                durationMs: Math.round(performance.now() - startedAt)
            };
        };

        const executable = path.join(directory, outputName);
        const runResult = await execute(executable, [], directory, 3_000);

        return {
            compileSucceeded: true,
            stdout: runResult.stdout,
            stderr: runResult.stderr,
            exitCode: runResult.exitCode,
            timedOut: runResult.timeOut,
            durationMs: Math.round(performance.now() - startedAt)
        };
    } finally {
        await rm(directory, { recursive: true, force: true} );
    }
}





