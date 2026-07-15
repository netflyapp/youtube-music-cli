import WebSocket from 'ws';
import type {PlayerAction, PlayerState, SongSearchResult, Track} from './types';

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 8080;
const TIMEOUT_MS = 10_000;

function getServerUrl(): string {
	const host = process.env.YMC_HOST ?? DEFAULT_HOST;
	const port = Number.parseInt(
		process.env.YMC_PORT ?? String(DEFAULT_PORT),
		10,
	);
	return `ws://${host}:${port}/ws`;
}

function connect(url: string): Promise<WebSocket> {
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(url);
		const timer = setTimeout(() => {
			ws.close();
			reject(new Error('Connection timed out'));
		}, TIMEOUT_MS);

		ws.on('open', () => {
			clearTimeout(timer);
			resolve(ws);
		});

		ws.on('error', err => {
			clearTimeout(timer);
			reject(err);
		});
	});
}

/**
 * Wait for a message matching the given predicate.
 * Returns the first message for which the predicate returns true.
 */
function waitForMsg<T>(
	ws: WebSocket,
	predicate: (data: unknown) => data is T,
): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			ws.close();
			reject(new Error('Response timed out'));
		}, TIMEOUT_MS);

		const handler = (raw: Buffer) => {
			try {
				const parsed = JSON.parse(raw.toString());
				if (predicate(parsed)) {
					clearTimeout(timer);
					ws.off('message', handler);
					resolve(parsed);
				}
			} catch {
				// ignore
			}
		};

		ws.on('message', handler);
	});
}

type Json = Record<string, unknown>;

function hasType<T extends string>(
	msg: unknown,
	type: T,
): msg is Json & {type: T} {
	return typeof msg === 'object' && msg !== null && (msg as Json).type === type;
}

function isStateUpdate(
	msg: unknown,
): msg is Json & {type: 'state-update'; state: PlayerState} {
	return (
		hasType(msg, 'state-update') &&
		typeof (msg as Json).state === 'object' &&
		(msg as Json).state !== null
	);
}

function isFavorites(
	msg: unknown,
): msg is Json & {type: 'favorites'; tracks: Track[]} {
	return hasType(msg, 'favorites') && Array.isArray((msg as Json).tracks);
}

function isSearchResults(
	msg: unknown,
): msg is Json & {type: 'search-results'; results: SongSearchResult[]} {
	return hasType(msg, 'search-results') && Array.isArray((msg as Json).results);
}

function isAuthSuccess(
	msg: unknown,
): msg is Json & {type: 'auth'; success: true} {
	return hasType(msg, 'auth') && (msg as Json).success === true;
}

/**
 * Connect and wait for both auth and initial state-update.
 * Server sends state-update BEFORE auth, so we collect the first
 * state-update that arrives during the handshake.
 */
async function handshake(
	url: string,
): Promise<{ws: WebSocket; initialState: PlayerState}> {
	const ws = await connect(url);

	// Collect messages until we have both auth and state-update
	let initialState: PlayerState | null = null;
	let authed = false;

	const result = await new Promise<{ws: WebSocket; initialState: PlayerState}>(
		(resolve, reject) => {
			const timer = setTimeout(() => {
				ws.close();
				reject(new Error('Handshake timed out'));
			}, TIMEOUT_MS);

			const handler = (raw: Buffer) => {
				try {
					const parsed = JSON.parse(raw.toString());

					if (isStateUpdate(parsed) && !initialState) {
						initialState = parsed.state;
					}

					if (isAuthSuccess(parsed)) {
						authed = true;
					}

					if (initialState && authed) {
						clearTimeout(timer);
						ws.off('message', handler);
						resolve({ws, initialState});
					}
				} catch {
					// ignore
				}
			};

			ws.on('message', handler);
		},
	);

	return result;
}

export async function getPlayerState(): Promise<PlayerState> {
	const {ws, initialState} = await handshake(getServerUrl());
	ws.close();
	return initialState;
}

export async function sendPlayerAction(
	action: PlayerAction,
): Promise<PlayerState> {
	const url = getServerUrl();
	const ws = await connect(url);

	try {
		// Wait for auth, ignore any state-update that arrives during handshake
		await waitForMsg(ws, isAuthSuccess);

		// Drain the initial state-update if it arrives after auth
		// Send the command
		ws.send(JSON.stringify({type: 'command', action}));

		// Wait for the response state-update
		const msg = await waitForMsg(
			ws,
			isStateUpdate as (
				data: unknown,
			) => data is Json & {type: 'state-update'; state: PlayerState},
		);
		return msg.state;
	} finally {
		ws.close();
	}
}

export async function getFavorites(): Promise<Track[]> {
	const url = getServerUrl();
	const ws = await connect(url);

	try {
		await waitForMsg(ws, isAuthSuccess);

		ws.send(JSON.stringify({type: 'favorites-request'}));

		const msg = await waitForMsg(ws, isFavorites);
		return msg.tracks;
	} finally {
		ws.close();
	}
}

export async function searchSongs(query: string): Promise<SongSearchResult[]> {
	const url = getServerUrl();
	const ws = await connect(url);

	try {
		// Wait for auth
		await waitForMsg(ws, isAuthSuccess);

		// Send search request
		ws.send(
			JSON.stringify({type: 'search-request', query, searchType: 'songs'}),
		);

		// Wait for results
		const msg = await waitForMsg(ws, isSearchResults);
		return msg.results.filter((r): r is SongSearchResult => r.type === 'song');
	} finally {
		ws.close();
	}
}
