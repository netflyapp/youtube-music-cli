import type {FrameBuffer} from './frame-buffer.ts';
import type {RGB} from './ansi-codes.ts';

const BRAILLE_BASE = 0x2800;

const BRAILLE_PATTERNS = [
	[0x01, 0x08],
	[0x02, 0x10],
	[0x04, 0x20],
	[0x40, 0x80],
];

export class BrailleCanvas {
	frameBuffer: FrameBuffer;
	pixelWidth: number;
	pixelHeight: number;

	constructor(frameBuffer: FrameBuffer) {
		this.frameBuffer = frameBuffer;
		this.pixelWidth = frameBuffer.width * 2;
		this.pixelHeight = frameBuffer.height * 4;
	}

	setPixel(x: number, y: number, color: RGB): void {
		const cellX = Math.floor(x / 2);
		const cellY = Math.floor(y / 4);

		if (cellX >= this.frameBuffer.width || cellY >= this.frameBuffer.height) {
			return;
		}

		const localX = x % 2;
		const localY = y % 4;

		const cell = this.frameBuffer.getCell(cellX, cellY);
		if (!cell) return;

		const dotIndex = localY * 2 + localX;
		const pattern = BRAILLE_PATTERNS[dotIndex] ?? [0x01, 0x08];

		let charCode = BRAILLE_BASE;
		for (let i = 0; i < pattern.length; i++) {
			if (dotIndex === i && pattern[i] !== undefined) {
				charCode |= pattern[i]!;
			}
		}

		const char = String.fromCharCode(charCode);

		this.frameBuffer.setCell(cellX, cellY, {
			char,
			fg: color,
			bg: cell.bg,
		});
	}

	drawRect(
		x: number,
		y: number,
		width: number,
		height: number,
		color: RGB,
		filled = false,
	): void {
		for (let dy = 0; dy < height; dy++) {
			for (let dx = 0; dx < width; dx++) {
				if (
					filled ||
					dx === 0 ||
					dx === width - 1 ||
					dy === 0 ||
					dy === height - 1
				) {
					this.setPixel(x + dx, y + dy, color);
				}
			}
		}
	}

	drawLine(x0: number, y0: number, x1: number, y1: number, color: RGB): void {
		const dx = Math.abs(x1 - x0);
		const dy = Math.abs(y1 - y0);
		const sx = x0 < x1 ? 1 : -1;
		const sy = y0 < y1 ? 1 : -1;
		let err = dx - dy;

		let x = x0;
		let y = y0;

		while (true) {
			this.setPixel(x, y, color);

			if (x === x1 && y === y1) break;

			const e2 = 2 * err;
			if (e2 > -dy) {
				err -= dy;
				x += sx;
			}

			if (e2 < dx) {
				err += dx;
				y += sy;
			}
		}
	}

	drawCircle(
		cx: number,
		cy: number,
		radius: number,
		color: RGB,
		filled = false,
	): void {
		let x = radius;
		let y = 0;
		let err = 0;

		while (x >= y) {
			if (filled) {
				this.drawLine(cx - x, cy + y, cx + x, cy + y, color);
				this.drawLine(cx - x, cy - y, cx + x, cy - y, color);
				this.drawLine(cx - y, cy + x, cx + y, cy + x, color);
				this.drawLine(cx - y, cy - x, cx + y, cy - x, color);
			} else {
				this.setPixel(cx + x, cy + y, color);
				this.setPixel(cx + y, cy + x, color);
				this.setPixel(cx - y, cy + x, color);
				this.setPixel(cx - x, cy + y, color);
				this.setPixel(cx + x, cy - y, color);
				this.setPixel(cx + y, cy - x, color);
				this.setPixel(cx - y, cy - x, color);
				this.setPixel(cx - x, cy - y, color);
			}

			y++;
			err += 1 + 2 * y;
			if (2 * (err - x) + 1 > 0) {
				x--;
				err += 1 - 2 * x;
			}
		}
	}

	clear(): void {
		for (let y = 0; y < this.frameBuffer.height; y++) {
			for (let x = 0; x < this.frameBuffer.width; x++) {
				this.frameBuffer.setCell(x, y, {
					char: ' ',
					fg: null,
					bg: null,
				});
			}
		}
	}
}
