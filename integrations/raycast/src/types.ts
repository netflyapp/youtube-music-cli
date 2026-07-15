export interface Artist {
	artistId: string;
	name: string;
}

export interface Album {
	albumId: string;
	name: string;
	artists: Artist[];
}

export interface Track {
	videoId: string;
	title: string;
	artists: Artist[];
	album?: Album;
	duration?: number;
}

export interface PlayerState {
	currentTrack: Track | null;
	isPlaying: boolean;
	volume: number;
	progress: number;
	duration: number;
	repeat: 'off' | 'all' | 'one';
	shuffle: boolean;
	isLoading: boolean;
	error: string | null;
}

export interface SongSearchResult {
	type: 'song';
	data: Track;
}

export type PlayerAction =
	| {category: 'PAUSE'}
	| {category: 'RESUME'}
	| {category: 'NEXT'}
	| {category: 'PREVIOUS'}
	| {category: 'VOLUME_UP'}
	| {category: 'VOLUME_DOWN'}
	| {category: 'TOGGLE_SHUFFLE'}
	| {category: 'TOGGLE_REPEAT'}
	| {category: 'TOGGLE_FAVORITE'; track?: Track}
	| {category: 'PLAY'; track: Track};
