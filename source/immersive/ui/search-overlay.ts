import type {SearchResult} from '../../types/youtube-music.types.ts';

export type SearchPhase = 'query' | 'results';

export interface SearchOverlayState {
	active: boolean;
	phase: SearchPhase;
	query: string;
	results: SearchResult[];
	selectedIndex: number;
	status: string | null;
}

export function createSearchOverlayState(): SearchOverlayState {
	return {
		active: false,
		phase: 'query',
		query: '',
		results: [],
		selectedIndex: 0,
		status: null,
	};
}

export function openSearchOverlay(state: SearchOverlayState): void {
	state.active = true;
	state.phase = 'query';
	state.query = '';
	state.results = [];
	state.selectedIndex = 0;
	state.status = null;
}

export function closeSearchOverlay(state: SearchOverlayState): void {
	state.active = false;
	state.phase = 'query';
	state.query = '';
	state.results = [];
	state.selectedIndex = 0;
	state.status = null;
}

export function setSearchResults(
	state: SearchOverlayState,
	results: SearchResult[],
): void {
	state.results = results;
	state.selectedIndex = 0;
	state.phase = 'results';
	state.status = null;
}

export function backToSearchQuery(state: SearchOverlayState): void {
	state.phase = 'query';
	state.results = [];
	state.selectedIndex = 0;
	state.status = null;
}

export type SearchQueryAction = 'submit' | 'cancel' | 'none';

export function handleSearchQueryInput(
	state: SearchOverlayState,
	key: string,
): SearchQueryAction {
	if (key === 'escape') {
		closeSearchOverlay(state);
		return 'cancel';
	}

	if (key === 'enter') {
		if (state.query.trim().length > 0) {
			return 'submit';
		}
		return 'none';
	}

	if (key === 'backspace') {
		state.query = state.query.slice(0, -1);
		return 'none';
	}

	if (key.length === 1 && key >= ' ' && key <= '~') {
		if (state.query.length < 80) {
			state.query += key;
		}
	}

	return 'none';
}

export type SearchResultsAction = 'none' | 'back' | 'play' | 'mix' | 'favorite';

export function handleSearchResultsInput(
	state: SearchOverlayState,
	key: string,
): SearchResultsAction {
	if (key === 'escape') {
		if (state.phase === 'results') {
			backToSearchQuery(state);
			return 'back';
		}
		closeSearchOverlay(state);
		return 'back';
	}

	if (key === 'up' || key === 'k') {
		state.selectedIndex = Math.max(0, state.selectedIndex - 1);
		return 'none';
	}

	if (key === 'down' || key === 'j') {
		state.selectedIndex = Math.min(
			Math.max(0, state.results.length - 1),
			state.selectedIndex + 1,
		);
		return 'none';
	}

	if (key === 'enter') {
		return 'play';
	}

	if (key === 'm') {
		return 'mix';
	}

	if (key === 'f') {
		return 'favorite';
	}

	return 'none';
}
