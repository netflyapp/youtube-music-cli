export const EOF_PAUSE_SUPPRESSION_MS = 8000;
export const STARTUP_PAUSE_SUPPRESSION_MS = 8000;
export const ADVANCE_DEBOUNCE_MS = 1500;

export type PauseSyncInput = {
	paused: boolean;
	isAdvancing: boolean;
	eofTimestamp: number;
	playbackStartTimestamp: number;
	currentTime: number;
	now?: number;
};

export function shouldSyncPauseFromMpv(input: PauseSyncInput): boolean {
	if (!input.paused) {
		return true;
	}

	if (input.isAdvancing) {
		return false;
	}

	const now = input.now ?? Date.now();

	if (now - input.eofTimestamp < EOF_PAUSE_SUPPRESSION_MS) {
		return false;
	}

	if (
		input.currentTime < 1 &&
		now - input.playbackStartTimestamp < STARTUP_PAUSE_SUPPRESSION_MS
	) {
		return false;
	}

	return true;
}

export function shouldDebounceAdvance(
	lastAdvanceAt: number,
	now: number = Date.now(),
): boolean {
	return now - lastAdvanceAt < ADVANCE_DEBOUNCE_MS;
}
