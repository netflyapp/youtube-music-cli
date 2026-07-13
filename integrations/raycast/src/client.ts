import WebSocket from 'ws';
import type {PlayerAction, PlayerState, SongSearchResult} from './types';

interface ServerStateUpdate {
	type: 'state-update';
	state: Partial<PlayerState>;
}

interface ServerSearchResults {
	type: 'search-results';
	results: SongSearchResult[];
}

interface ServerAuth {
	type: 'auth';
	success: boolean;
}

type ServerMessage = ServerStateUpdate | ServerSearchResults | ServerAuth;

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 8080;
const RESPONSE_TIMEOUT = 10_000;
const CONNECTION_TIMEOUT = 5_000;

function getServerUrl(): string {
	const host = process.env.YMC_HOST ?? DEFAULT_HOST;
	const port = Number.parseInt(
		process.env.YMC_PORT ?? String(DEFAULT_PORT),
		10,
	);
	return `ws://${host}:${port}/ws`;
}

function connectWs(url: string): Promise<WebSocket> {
	return new Promise((resolve, reject) => {
		const ws = new WebSocket(url);
		const timer = setTimeout(() => {
			ws.close();
			reject(new Error('Connection timed out'));
		}, CONNECTION_TIMEOUT);

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

function waitForMessage<T>(
	ws: WebSocket,
	filter: (msg: ServerMessage) => msg is T,
): Promise<T> {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			ws.close();
			reject(new Error('Response timed out'));
		}, RESPONSE_TIMEOUT);

		const handler = (data: Buffer) => {
			try {
				const parsed = JSON.parse(data.toString()) as ServerMessage;
				if (filter(parsed)) {
					clearTimeout(timer);
					ws.off('message', handler);
					resolve(parsed);
				}
			} catch {
				// ignore parse errors
			}
		};

		ws.on('message', handler);
	});
}

function isAuth(msg: ServerMessage): msg is ServerAuth {
	return msg.type === 'auth';
}

function isStateUpdate(msg: ServerMessage): msg is ServerStateUpdate {
	return msg.type === 'state-update' && msg.state != null;
}

function isSearchResults(msg: ServerMessage): msg is ServerSearchResults {
	return msg.type === 'search-results' && msg.results != null;
}

async function connectAndSync(url: string): Promise<WebSocket> {
	const ws = await connectWs(url);
	// Wait for the initial auth message before reading further
	const auth = await waitForMessage(ws, isAuth);
	if (!auth.success) {
		ws.close();
		throw new Error(auth.message ?? 'Authentication failed');
	}
	return ws;
}

export async function getPlayerState(): Promise<PlayerState> {
	const url = getServerUrl();
	const ws = await connectAndSync(url);

	try {
		const msg = await waitForMessage(ws, isStateUpdate);
		return msg.state as PlayerState;
	} finally {
		ws.close();
	}
}

export async function sendPlayerAction(
	action: PlayerAction,
): Promise<PlayerState> {
	const url = getServerUrl();
	const ws = await connectAndSync(url);

	try {
		// Drain the initial state-update that arrives on connect
		await waitForMessage(ws, isStateUpdate);

		// Now send the command and wait for the next state-update
		ws.send(JSON.stringify({type: 'command', action}));
		const msg = await waitForMessage(ws, isStateUpdate);
		return msg.state as PlayerState;
	} finally {
		ws.close();
	}
}

export async function searchSongs(query: string): Promise<SongSearchResult[]> {
	const url = getServerUrl();
	const ws = await connectAndSync(url);

	try {
		// Drain the initial state-update
		await waitForMessage(ws, isStateUpdate);

		// Send search request and wait for results
		ws.send(
			JSON.stringify({type: 'search-request', query, searchType: 'songs'}),
		);
		const msg = await waitForMessage(ws, isSearchResults);
		return msg.results.filter((r): r is SongSearchResult => r.type === 'song');
	} finally {
		ws.close();
	}
}
