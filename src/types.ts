export interface CodeBlockMetadata {
	language?: string;
	filename?: string;
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
	compileSucceded: boolean;
	stdout: string;
	stderr: string;
	exitCode: number | null;
	timeout: boolean;
	durationMs: number;
}

export interface MarkrunEnv {
	markrun?: {
		cppFiles: CppFile[];
	}
}


