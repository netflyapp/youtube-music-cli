import type {Track} from '../../types/youtube-music.types.ts';

export const AUTOPLAY_TRACKS_AHEAD_NORMAL = 5;
export const AUTOPLAY_TRACKS_AHEAD_RADIO = 15;
export const AUTOPLAY_RESUME_NEAR_END_SECONDS = 5;
export const SESSION_HISTORY_MAX = 30;
export const AUTOPLAY_TICK_MS = 2000;

export type AutoplayQueueState = {
	autoplay: boolean;
	isPlaying: boolean;
	repeat: 'off' | 'all' | 'one';
	shuffle: boolean;
	queueLength: number;
	queuePosition: number;
	currentTrackVideoId: string | null;
	radioIsActive: boolean;
};

export type AutoplayPrefetchContext = {
	fetchedForVideoId: string | null;
	isFetching: boolean;
	/** True when EOF hit queue end and we are waiting for suggestions. */
	waitingAtQueueEnd?: boolean;
};

export function isAtQueueEnd(state: {
	queueLength: number;
	queuePosition: number;
}): boolean {
	return state.queueLength > 0 && state.queuePosition >= state.queueLength - 1;
}

export function getTracksAhead(state: {
	queueLength: number;
	queuePosition: number;
}): number {
	return state.queueLength - state.queuePosition - 1;
}

export function getAutoplayTracksAheadThreshold(
	radioIsActive: boolean,
): number {
	return radioIsActive
		? AUTOPLAY_TRACKS_AHEAD_RADIO
		: AUTOPLAY_TRACKS_AHEAD_NORMAL;
}

export function shouldPrefetchAutoplay(
	state: AutoplayQueueState,
	context?: AutoplayPrefetchContext,
): boolean {
	if (!state.autoplay || !state.currentTrackVideoId) {
		return false;
	}

	const waitingAtQueueEnd = context?.waitingAtQueueEnd === true;
	if (!state.isPlaying && !waitingAtQueueEnd) {
		return false;
	}

	if (state.repeat === 'all' || (state.shuffle && state.queueLength > 1)) {
		return false;
	}

	const threshold = getAutoplayTracksAheadThreshold(state.radioIsActive);
	if (getTracksAhead(state) > threshold) {
		return false;
	}

	if (context?.isFetching) {
		return false;
	}

	const atEnd = isAtQueueEnd(state);
	if (
		context?.fetchedForVideoId === state.currentTrackVideoId &&
		!waitingAtQueueEnd &&
		!atEnd
	) {
		return false;
	}

	return true;
}

export function shouldDeferPauseAtQueueEnd(
	autoplay: boolean,
	isFetchingAutoplay: boolean,
): boolean {
	return autoplay || isFetchingAutoplay;
}

export function mergeSuggestionTracks(
	existingVideoIds: ReadonlySet<string>,
	newTracks: Track[],
): Track[] {
	const result: Track[] = [];
	const seen = new Set(existingVideoIds);
	for (const track of newTracks) {
		if (!track.videoId || seen.has(track.videoId)) {
			continue;
		}
		seen.add(track.videoId);
		result.push(track);
	}
	return result;
}

export function shouldResumeAfterPrefetch(
	wasAtEndOfQueue: boolean,
	progress: number,
	duration: number,
): boolean {
	if (!wasAtEndOfQueue) {
		return false;
	}

	if (duration <= 0) {
		return true;
	}

	return progress >= duration - AUTOPLAY_RESUME_NEAR_END_SECONDS;
}

export function recordSessionTrack(
	history: string[],
	videoId: string,
	maxSize = SESSION_HISTORY_MAX,
): string[] {
	if (!videoId) {
		return history;
	}

	const withoutCurrent = history.filter(id => id !== videoId);
	const next = [...withoutCurrent, videoId];
	if (next.length <= maxSize) {
		return next;
	}
	return next.slice(next.length - maxSize);
}

export function pickHistoryFallbackSeed(
	history: string[],
	cursor: number,
	excludeIds: ReadonlySet<string>,
): {seed: string | null; nextCursor: number} {
	if (history.length === 0) {
		return {seed: null, nextCursor: cursor};
	}

	for (let offset = 0; offset < history.length; offset++) {
		const index = (cursor + offset) % history.length;
		const seed = history[index];
		if (seed && !excludeIds.has(seed)) {
			return {seed, nextCursor: (index + 1) % history.length};
		}
	}

	return {seed: null, nextCursor: cursor};
}
