import process from 'node:process';

export interface TerminalInfo {
	width: number;
	height: number;
	pixelWidth: number;
	pixelHeight: number;
}

export function getTerminalInfo(): TerminalInfo {
	const width = process.stdout.columns || 120;
	const height = process.stdout.rows || 30;

	return {
		width,
		height,
		pixelWidth: width * 10,
		pixelHeight: height * 20,
	};
}

export function setConsoleTitle(title: string): void {
	process.stdout.write(`\x1B]0;${title}\x07`);
}

export function clearScreen(): void {
	process.stdout.write('\x1B[2J\x1B[H');
}

export function hideCursor(): void {
	process.stdout.write('\x1B[?25l');
}

export function showCursor(): void {
	process.stdout.write('\x1B[?25h');
}

export function enterAltBuffer(): void {
	process.stdout.write('\x1B[?1049h');
}

export function exitAltBuffer(): void {
	process.stdout.write('\x1B[?1049l');
}

export function resetCursor(): void {
	process.stdout.write('\x1B[H');
}
