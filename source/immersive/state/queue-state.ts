import type {Track} from '../../types/youtube-music.types.ts';

export type RepeatMode = 'off' | 'all' | 'one';

export interface ImmersivePlayerState {
	currentTrack: Track | null;
	queue: Track[];
	queueIndex: number;
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isDiscoMode: boolean;
	shuffle: boolean;
	repeat: RepeatMode;
}

export function createInitialImmersiveState(
	overrides: Partial<ImmersivePlayerState> = {},
): ImmersivePlayerState {
	return {
		currentTrack: null,
		queue: [],
		queueIndex: 0,
		isPlaying: false,
		currentTime: 0,
		duration: 0,
		volume: 70,
		isDiscoMode: false,
		shuffle: false,
		repeat: 'off',
		...overrides,
	};
}

export function setQueue(state: ImmersivePlayerState, tracks: Track[]): void {
	state.queue = [...tracks];
	state.queueIndex = 0;
	state.currentTrack = tracks[0] ?? null;
}

export function addToQueue(state: ImmersivePlayerState, track: Track): void {
	state.queue.push(track);
	if (!state.currentTrack) {
		state.currentTrack = track;
		state.queueIndex = 0;
	}
}

export function toggleShuffle(state: ImmersivePlayerState): boolean {
	state.shuffle = !state.shuffle;
	return state.shuffle;
}

export function cycleRepeat(state: ImmersivePlayerState): RepeatMode {
	const modes: RepeatMode[] = ['off', 'all', 'one'];
	const index = modes.indexOf(state.repeat);
	state.repeat = modes[(index + 1) % modes.length] ?? 'off';
	return state.repeat;
}

export function advanceQueue(state: ImmersivePlayerState): Track | null {
	if (state.queue.length === 0) {
		state.currentTrack = null;
		return null;
	}

	if (state.shuffle && state.queue.length > 1) {
		let randomIndex = state.queueIndex;
		while (randomIndex === state.queueIndex) {
			randomIndex = Math.floor(Math.random() * state.queue.length);
		}
		state.queueIndex = randomIndex;
		state.currentTrack = state.queue[randomIndex] ?? null;
		state.currentTime = 0;
		return state.currentTrack;
	}

	const nextIndex = state.queueIndex + 1;
	if (nextIndex >= state.queue.length) {
		if (state.repeat === 'all') {
			state.queueIndex = 0;
			state.currentTrack = state.queue[0] ?? null;
			state.currentTime = 0;
			return state.currentTrack;
		}
		state.isPlaying = false;
		return null;
	}

	state.queueIndex = nextIndex;
	state.currentTrack = state.queue[nextIndex] ?? null;
	state.currentTime = 0;
	return state.currentTrack;
}

export function previousQueue(state: ImmersivePlayerState): Track | null {
	if (state.queue.length === 0) {
		return null;
	}

	if (state.currentTime > 3 && state.currentTrack) {
		state.currentTime = 0;
		return state.currentTrack;
	}

	const prevIndex = Math.max(0, state.queueIndex - 1);
	state.queueIndex = prevIndex;
	state.currentTrack = state.queue[prevIndex] ?? null;
	state.currentTime = 0;
	return state.currentTrack;
}

export function getUpcomingTracks(
	state: ImmersivePlayerState,
	count: number,
): Track[] {
	const upcoming: Track[] = [];
	for (
		let i = state.queueIndex + 1;
		i < state.queue.length && upcoming.length < count;
		i++
	) {
		const track = state.queue[i];
		if (track) {
			upcoming.push(track);
		}
	}
	return upcoming;
}

export function trackArtists(track: Track): string {
	if (track.artists.length === 0) {
		return 'Unknown Artist';
	}
	return track.artists.map(artist => artist.name).join(', ');
}

export function trackYouTubeUrl(track: Track): string {
	return `https://www.youtube.com/watch?v=${track.videoId}`;
}

export function formatRepeatLabel(repeat: RepeatMode): string {
	if (repeat === 'all') {
		return 'ALL';
	}
	if (repeat === 'one') {
		return 'ONE';
	}
	return 'OFF';
}
