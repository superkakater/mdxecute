import { execFile } from "node:child_process";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { performance } from "node:perf_hooks";
import type { CompileRunResult, CppProject } from "./types.ts";

interface ProcessResult {
    stdout: string;
    stderr: string;
    exitCode: number | null;
    timeOut: boolean;
}

function execute(executable: string, args: string[], cwd: string, timeoutMs: number): Promise<ProcessResult> {

    return new Promise((resolve) => {
        execFile(
            executable,
            args,
            {
                cwd,
                timeout: timeoutMs,
                maxBuffer: 1024 * 1024,
                windowsHide: true
            },
            (error, stdout, stderr) => {
                if (!error) {
                    resolve({stdout, stderr, exitCode: 0, timeOut: false});
                    return;
                }

                const errorWithCode = error as NodeJS.ErrnoException & {
                    code?: string | number;
                    killed?: boolean;
                    signal?: NodeJS.Signals;
                };

                if (errorWithCode.code === "ENOENT") {
                    resolve({stdout, stderr: `${stderr}${stderr ? "\n" : ""}Could not find executable: ${executable}`, exitCode: null, timeOut: false});
                    return;
                }

                resolve({stdout, stderr, exitCode: typeof errorWithCode.code === "number" ? errorWithCode.code : null, timeOut: Boolean(errorWithCode.killed)})
            }
        );
    })
}

async function writeProject(proejct: CppProject, directory: string): Promise<void> {

    for (const file of proejct.files) {
        const target = path.join(directory, file.filename);
        await mkdir(path.dirname(target), {recursive: true});
        await writeFile(target, file.source, "utf8");
    }
}

export async function compileAndRun(project: CppProject): Promise<CompileRunResult> {

    const startedAt = performance.now();

    if (!project.entryPoint) {
        return {compileSucceded: false, stdout: "", stderr: "No main.cpp block exists in this markdown file.", exitCode: null, timeout: false, durationMs: 0}
    }

    const directory = await mkdtemp(path.join(tmpdir(), "markrun-"));

    try {
        await writeProject(project, directory);
        const cppSources = project.files
            .map((file) => file.filename)
            .filter((filename) => filename.endsWith(".cpp"));

        if (cppSources.length === 0) {
            throw new Error("No .cpp files were found");
        }

        const outputName = process.platform === "win32" ? "markrun.exe" : "markrun.out";

        const compileResult = await execute(
            "g++",
            ["-std=c++20", "-Wall", "-Wextra", "-I.", ...cppSources, "-o", outputName],
            directory,
            10_000
        );

        if (compileResult.exitCode !== 0) {
            return {
                compileSucceded: false,
                stdout: compileResult.stdout,
                stderr: compileResult.stderr,
                exitCode: compileResult.exitCode,
                timeout: compileResult.timeOut,
                durationMs: Math.round(performance.now() - startedAt)
            };
        };

        const executable = path.join(directory, outputName);
        const runResult = await execute(executable, [], directory, 3_000);

        return {
            compileSucceded: true,
            stdout: runResult.stdout,
            stderr: runResult.stderr,
            exitCode: runResult.exitCode,
            timeout: runResult.timeOut,
            durationMs: Math.round(performance.now() - startedAt)
        };
    } finally {
        await rm(directory, { recursive: true, force: true} );
    }
}





