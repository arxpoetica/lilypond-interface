import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join, dirname, basename, extname } from 'path';
import { existsSync } from 'fs';
import type { LilyPondOptions, LilyPondResult } from './types.d.ts';

const execAsync = promisify(exec);

export type { LilyPondOptions, LilyPondResult } from './types.d.ts';

/**
 * Compiles LilyPond source to various output formats
 */
export async function compile(options: LilyPondOptions): Promise<LilyPondResult> {
	if (!options.inputFile && !options.source) {
		throw new Error('Either `inputFile` or `source` must be provided');
	}
	if (options.inputFile && options.source) {
		throw new Error('Cannot provide both `inputFile` and `source`');
	}

	let inputPath: string;
	let tempFile: string | null = null;
	let outputBasePath: string;

	try {
		// handle source string input
		if (options.source) {
			const tempDir = tmpdir();
			const tempFileName = `lilypond-${Date.now()}-${Math.random().toString(36).slice(2)}.ly`;
			tempFile = join(tempDir, tempFileName);
			await writeFile(tempFile, options.source, 'utf-8');
			inputPath = tempFile;
		} else {
			inputPath = options.inputFile!;
		}

		// determine output path
		if (options.outputPath) {
			outputBasePath = options.outputPath;
			// create output directory if it doesn't exist and outputPath is a directory
			const outputDir = dirname(outputBasePath);
			if (outputDir && !existsSync(outputDir)) {
				await mkdir(outputDir, { recursive: true });
			}
		} else {
			// use input file's directory and basename
			const inputBasename = basename(inputPath, extname(inputPath));
			outputBasePath = join(dirname(inputPath), inputBasename);
		}

		// build command
		const args: string[] = ['lilypond'];

		// add formats
		const formats = options.formats || ['svg'];
		for (const format of formats) {
			if (format === 'eps') {
				args.push('-E');
			} else {
				args.push(`--${format}`);
			}
		}

		// add output path
		args.push('-o', outputBasePath);

		// add log level
		if (options.logLevel) args.push('--loglevel', options.logLevel);

		// add silent flag
		if (options.silent) args.push('-s');

		// add include paths
		if (options.includePaths) {
			for (const includePath of options.includePaths) {
				args.push('-I', includePath);
			}
		}

		// add define defaults
		if (options.defineDefaults) {
			for (const [key, value] of Object.entries(options.defineDefaults)) {
				if (typeof value === 'boolean') {
					args.push('-d', value ? key : `no-${key}`);
				} else {
					args.push('-d', `${key}=${value}`);
				}
			}
		}

		// Add input file
		args.push(inputPath);

		// -------------------- >>>
		// -------------------- >>> Execute LilyPond
		// -------------------- >>>

		// quote arguments with spaces
		const command = args.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ');

		let stderr: string;
		let exitCode = 0;

		try {
			const result = await execAsync(command);
			stderr = result.stderr;
		} catch (error: any) {
			stderr = error.stderr || '';
			exitCode = error.code || 1;
		}

		// parse warnings and errors from stderr
		const { warnings, errors } = parseOutput(stderr);

		// build result
		const success = exitCode === 0;
		const outputFiles = formats.map((format) => `${outputBasePath}.${format}`);
		const result: LilyPondResult = {
			success,
			outputFiles: success ? outputFiles : [],
			warnings: warnings.length > 0 ? warnings : undefined,
		};

		if (!success) {
			if (errors.length) result.error = errors.join('\n');
			else result.error = `LilyPond compilation failed with exit code ${exitCode}`;
		}

		return result;
	} finally {
		// prettier-ignore
		if (tempFile) try { await unlink(tempFile); } catch (error) { /* no-op */ }
	}
}

/**
 * Parse warnings and errors from LilyPond output
 */
function parseOutput(stderr: string) {
	const warnings: string[] = [];
	const errors: string[] = [];

	const lines = stderr.split('\n');
	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		if (trimmed.toLowerCase().includes('warning:')) {
			warnings.push(trimmed);
		} else if (trimmed.toLowerCase().includes('error:')) {
			errors.push(trimmed);
		} else if (trimmed.toLowerCase().includes('fatal error:')) {
			errors.push(trimmed);
		}
	}

	return { warnings, errors };
}
