/**
 * Options for LilyPond compilation
 */
export interface LilyPondOptions {
	/** Path to .ly file (mutually exclusive with source) */
	inputFile?: string;
	/** LilyPond source code string (mutually exclusive with inputFile) */
	source?: string;
	/** Output directory or file basename (without extension) */
	outputPath?: string;
	/** Output formats to generate */
	formats?: Array<'pdf' | 'svg' | 'png' | 'ps' | 'eps'>;
	/** Log level for LilyPond output */
	logLevel?: 'NONE' | 'ERROR' | 'WARNING' | 'BASIC' | 'PROGRESS' | 'INFO' | 'DEBUG';
	/** Additional include directories */
	includePaths?: string[];
	/** Suppress progress output */
	silent?: boolean;
	/** Scheme options to define */
	defineDefaults?: Record<string, string | boolean>;
}

/**
 * Result of LilyPond compilation
 */
export interface LilyPondResult {
	/** Whether compilation succeeded */
	success: boolean;
	/** Paths to generated output files */
	outputFiles: string[];
	/** Error message if compilation failed */
	error?: string;
	/** Warning messages (can exist even on success) */
	warnings?: string[];
}
