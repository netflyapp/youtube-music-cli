import test from 'ava';

test('ScrobblingService: now-playing posts to Last.fm track.updateNowPlaying endpoint', async t => {
	const {ScrobblingService} = await import(
		'../source/services/scrobbling/scrobbling.service.ts'
	);
	const originalFetch = globalThis.fetch;
	const calls = [];
	globalThis.fetch = (url, init) => {
		calls.push({url: String(url), init});
		return Promise.resolve({
			ok: true,
			status: 200,
			json: async () => ({}),
		});
	};
	t.teardown(() => {
		globalThis.fetch = originalFetch;
	});

	const svc = new ScrobblingService();
	svc.configure({lastfm: {apiKey: 'k', sessionKey: 's'}});
	await svc.nowPlaying({title: 'T', artist: 'A', duration: 200});
	t.is(calls.length, 1);
	const call = calls[0];
	t.is(call.url, 'https://ws.audioscrobbler.com/2.0/');
	const body = call.init.body;
	t.truthy(body instanceof URLSearchParams);
	t.is(body.get('method'), 'track.updateNowPlaying');
	t.is(body.get('artist'), 'A');
	t.is(body.get('track'), 'T');
	t.truthy(body.get('api_sig'));
});

test('ScrobblingService: now-playing also posts listen_type=playing_now to ListenBrainz', async t => {
	const {ScrobblingService} = await import(
		'../source/services/scrobbling/scrobbling.service.ts'
	);
	const originalFetch = globalThis.fetch;
	const calls = [];
	globalThis.fetch = (url, init) => {
		calls.push({url: String(url), init});
		return Promise.resolve({
			ok: true,
			status: 200,
			json: async () => ({}),
		});
	};
	t.teardown(() => {
		globalThis.fetch = originalFetch;
	});

	const svc = new ScrobblingService();
	svc.configure({listenbrainz: {token: 'tok'}});
	await svc.nowPlaying({title: 'T', artist: 'A', duration: 200});
	t.is(calls.length, 1);
	const call = calls[0];
	t.is(call.url, 'https://api.listenbrainz.org/1/submit-listens');
	const payload = JSON.parse(call.init.body);
	t.is(payload.listen_type, 'playing_now');
	t.is(payload.payload[0].track_metadata.artist_name, 'A');
	t.is(payload.payload[0].track_metadata.track_name, 'T');
});

test('ScrobblingService: now-playing is a no-op when disabled', async t => {
	const {ScrobblingService} = await import(
		'../source/services/scrobbling/scrobbling.service.ts'
	);
	const originalFetch = globalThis.fetch;
	let called = 0;
	globalThis.fetch = () => {
		called++;
		return Promise.resolve({ok: true, status: 200, json: async () => ({})});
	};
	t.teardown(() => {
		globalThis.fetch = originalFetch;
	});

	const svc = new ScrobblingService();
	await svc.nowPlaying({title: 'T', artist: 'A', duration: 200});
	t.is(called, 0);
});

test('ScrobblingService: now-playing does not throw on HTTP error', async t => {
	const {ScrobblingService} = await import(
		'../source/services/scrobbling/scrobbling.service.ts'
	);
	const originalFetch = globalThis.fetch;
	globalThis.fetch = () =>
		Promise.resolve({ok: false, status: 503, json: async () => ({})});
	t.teardown(() => {
		globalThis.fetch = originalFetch;
	});

	const svc = new ScrobblingService();
	svc.configure({lastfm: {apiKey: 'k', sessionKey: 's'}});
	await t.notThrowsAsync(async () =>
		svc.nowPlaying({title: 'T', artist: 'A', duration: 200}),
	);
});
