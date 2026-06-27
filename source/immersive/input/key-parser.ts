const ARROW_CODES: Record<string, string> = {
	'\x1B[A': 'up',
	'\x1B[B': 'down',
	'\x1B[C': 'right',
	'\x1B[D': 'left',
	'\x1B': 'escape',
};

const CTRL_COMMA_SEQUENCES = ['\x1c', '\x1b[44;5u', '\x1b[44;5;u'];

function parseShiftLetter(data: string): string | null {
	if (data.length !== 1 || data < 'A' || data > 'Z') {
		return null;
	}
	return `Shift+${data}`;
}

export function parseKeyName(data: string): string | null {
	if (ARROW_CODES[data]) {
		return ARROW_CODES[data]!;
	}

	if (CTRL_COMMA_SEQUENCES.includes(data)) {
		return 'Ctrl+,';
	}

	if (data === ' ') {
		return ' ';
	}

	if (data === '\x03') {
		return 'Ctrl+C';
	}

	if (data === '\r' || data === '\n') {
		return 'enter';
	}

	if (data === '\x7F' || data === '\b') {
		return 'backspace';
	}

	if (data.length === 1 && data >= 'a' && data <= 'z') {
		return data;
	}

	const shiftKey = parseShiftLetter(data);
	if (shiftKey) {
		return shiftKey;
	}

	if (data === '/' || data === '?') {
		return '/';
	}

	return null;
}
