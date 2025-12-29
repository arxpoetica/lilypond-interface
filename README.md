# LilyPond Interface

Composing with LilyPond via the web.

## LilyPond API Wrapper

This project includes a programmatic TypeScript wrapper around the LilyPond CLI for compiling LilyPond source code to various output formats.

### Installation

The wrapper is located at `src/lib/server/lilypond` and requires LilyPond to be installed on your system.

### Usage

```ts
import { compile } from '$lib/server/lilypond';

// Compile from source string (defaults to SVG)
const result = await compile({
	source: `\\version "2.24.0"
	{ c' d' e' f' g' a' b' c'' }`,
	outputPath: './output/my-score'
});

// Compile to multiple formats
const result = await compile({
	source: '{ c d e f }',
	outputPath: './output/score',
	formats: ['svg', 'pdf', 'png']
});

// Compile from a file
const result = await compile({
	inputFile: './scores/song.ly',
	formats: ['svg']
});
```

### API Reference

```ts
compile(options: LilyPondOptions): Promise<LilyPondResult>
```

Compiles LilyPond source code to various output formats.

##### Options

```ts
interface LilyPondOptions {
	// Input (mutually exclusive)
	inputFile?: string;              // Path to .ly file
  source?: string;                 // LilyPond source code string

	// Output
  outputPath?: string;             // Output directory or file basename
  formats?: Array<'pdf' | 'svg' | 'png' | 'ps' | 'eps'>; // Default: ['svg']

	// Compilation options
	logLevel?: 'NONE' | 'ERROR' | 'WARNING' | 'BASIC' | 'PROGRESS' | 'INFO' | 'DEBUG';
	includePaths?: string[];         // Additional include directories
	silent?: boolean;                // Suppress progress output
	defineDefaults?: Record<string, string | boolean>; // Scheme options
}
```

##### Result

```ts
interface LilyPondResult {
	success: boolean;                // Whether compilation succeeded
	outputFiles: string[];           // Paths to generated files
	error?: string;                  // Error message if failed
	warnings?: string[];             // Warning messages (even on success)
}
```

### Examples

##### Simple compilation with default SVG output

```ts
const result = await compile({
	source: `\\version "2.24.0"
\\header {
	title = "Simple Scale"
}
{ c' d' e' f' g' a' b' c'' }`
});

if (result.success) {
	console.log('Generated:', result.outputFiles);
	// Generated: ['./output.svg']
}
```

##### Multiple formats for web and print

```ts
const result = await compile({
	source: myLilyPondCode,
	outputPath: './public/scores/song',
	formats: ['svg', 'pdf'],  // SVG for web, PDF for download
  silent: true
});
```

##### With custom includes and options

```ts
const result = await compile({
	inputFile: './scores/symphony.ly',
	outputPath: './output/symphony',
	formats: ['pdf'],
	includePaths: ['./includes', './templates'],
	logLevel: 'WARNING',
	defineDefaults: {
  	'no-point-and-click': true
  }
});
```

##### Error handling

```ts
const result = await compile({
	source: invalidLilyPondCode
});

if (!result.success) {
	console.error('Compilation failed:', result.error);
}

if (result.warnings) {
	console.warn('Warnings:', result.warnings);
}
```
