export interface CodeBlockMetadata {
	language?: string;
	filename?: string;
	run?: boolean;
}

export interface CppFile {
	id: string;
	filename: string;
	source: string;
	isEntryPoint: boolean;
}

export interface CppProject {
	files: CppFile[];
	entryPoint?: CppFile;
}

export interface CompileRunResult {
	compileSucceeded: boolean;
	stdout: string;
	stderr: string;
	exitCode: number | null;
	timedOut: boolean;
	durationMs: number;
}

export interface MarkrunEnv extends Record<PropertyKey, unknown> {
	markrun?: {
		cppFiles: CppFile[];
	}
}


