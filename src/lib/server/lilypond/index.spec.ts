import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, unlink, mkdir, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { compile } from './index';

const TEST_OUTPUT_DIR = join(tmpdir(), 'lilypond-test-output');

beforeAll(async () => {
	await mkdir(TEST_OUTPUT_DIR, { recursive: true });
});

afterAll(async () => {
	await rm(TEST_OUTPUT_DIR, { recursive: true, force: true });
});

describe('compile', () => {
	it('should compile a simple LilyPond source string to PDF', async () => {
		const source = `\\version "2.24.0"
{ c' d' e' f' }`;

		const result = await compile({
			source,
			outputPath: join(TEST_OUTPUT_DIR, 'test-simple'),
			formats: ['pdf'],
		});

		expect(result.success).toBe(true);
		expect(result.outputFiles).toHaveLength(1);
		expect(result.outputFiles[0]).toContain('test-simple.pdf');
		expect(result.error).toBeUndefined();
	});

	it('should compile a LilyPond file to multiple formats', async () => {
		const source = `\\version "2.24.0"
{ c' d' e' f' g' a' b' c'' }`;

		const result = await compile({
			source,
			outputPath: join(TEST_OUTPUT_DIR, 'test-multi'),
			formats: ['pdf', 'svg', 'png'],
		});

		expect(result.success).toBe(true);
		expect(result.outputFiles).toHaveLength(3);
		expect(result.outputFiles).toContain(join(TEST_OUTPUT_DIR, 'test-multi.pdf'));
		expect(result.outputFiles).toContain(join(TEST_OUTPUT_DIR, 'test-multi.svg'));
		expect(result.outputFiles).toContain(join(TEST_OUTPUT_DIR, 'test-multi.png'));
	});

	it('should compile from a file path', async () => {
		const testFile = join(TEST_OUTPUT_DIR, 'test-input.ly');
		const source = `\\version "2.24.0"
{ c' e' g' c'' }`;

		await writeFile(testFile, source, 'utf-8');

		const result = await compile({
			inputFile: testFile,
			formats: ['pdf'],
		});

		expect(result.success).toBe(true);
		expect(result.outputFiles).toHaveLength(1);
		expect(result.outputFiles[0]).toContain('test-input.pdf');

		// Cleanup
		await unlink(testFile);
	});

	it('should handle compilation errors gracefully', async () => {
		const invalidSource = `\\version "2.24.0"
{ c' d' e' // missing closing brace`;

		const result = await compile({
			source: invalidSource,
			outputPath: join(TEST_OUTPUT_DIR, 'test-error'),
			formats: ['pdf'],
		});

		expect(result.success).toBe(false);
		expect(result.error).toBeDefined();
		expect(result.outputFiles).toHaveLength(0);
	});

	it('should throw error if neither inputFile nor source is provided', async () => {
		await expect(
			compile({
				formats: ['pdf'],
			}),
		).rejects.toThrow('Either `inputFile` or `source` must be provided');
	});

	it('should throw error if both inputFile and source are provided', async () => {
		await expect(
			compile({
				inputFile: 'test.ly',
				source: '{ c }',
				formats: ['pdf'],
			}),
		).rejects.toThrow('Cannot provide both `inputFile` and `source`');
	});

	it('should default to SVG format when no formats are specified', async () => {
		const source = `\\version "2.24.0"
{ c' }`;

		const result = await compile({
			source,
			outputPath: join(TEST_OUTPUT_DIR, 'test-default-format'),
		});

		expect(result.success).toBe(true);
		expect(result.outputFiles).toHaveLength(1);
		expect(result.outputFiles[0]).toContain('.svg');
	});

	it('should support EPS format', async () => {
		const source = `\\version "2.24.0"
{ c' d' e' }`;

		const result = await compile({
			source,
			outputPath: join(TEST_OUTPUT_DIR, 'test-eps'),
			formats: ['eps'],
		});

		expect(result.success).toBe(true);
		expect(result.outputFiles).toHaveLength(1);
		expect(result.outputFiles[0]).toContain('.eps');
	});

	it('should respect silent flag', async () => {
		const source = `\\version "2.24.0"
{ c' }`;

		const result = await compile({
			source,
			outputPath: join(TEST_OUTPUT_DIR, 'test-silent'),
			formats: ['pdf'],
			silent: true,
		});

		expect(result.success).toBe(true);
	});
});
