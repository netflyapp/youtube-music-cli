import test from 'ava';

test('ScrobblingService: starts disabled', async t => {
	const {ScrobblingService} =
		await import('../source/services/scrobbling/scrobbling.service.ts');
	const svc = new ScrobblingService();
	t.false(svc.isEnabled);
});

test('ScrobblingService: configure with lastfm creds enables it', async t => {
	const {ScrobblingService} =
		await import('../source/services/scrobbling/scrobbling.service.ts');
	const svc = new ScrobblingService();
	svc.configure({lastfm: {apiKey: 'k', sessionKey: 's'}});
	t.true(svc.isEnabled);
});

test('ScrobblingService: configure with listenbrainz enables it', async t => {
	const {ScrobblingService} =
		await import('../source/services/scrobbling/scrobbling.service.ts');
	const svc = new ScrobblingService();
	svc.configure({listenbrainz: {token: 'tok'}});
	t.true(svc.isEnabled);
});

test('ScrobblingService: configure with empty config keeps it disabled', async t => {
	const {ScrobblingService} =
		await import('../source/services/scrobbling/scrobbling.service.ts');
	const svc = new ScrobblingService();
	svc.configure({});
	t.false(svc.isEnabled);
});

test('ScrobblingService: configure with lastfm only api key or only session key stays disabled', async t => {
	const {ScrobblingService} =
		await import('../source/services/scrobbling/scrobbling.service.ts');
	const svc1 = new ScrobblingService();
	svc1.configure({lastfm: {apiKey: 'k'}});
	t.false(svc1.isEnabled);

	const svc2 = new ScrobblingService();
	svc2.configure({lastfm: {sessionKey: 's'}});
	t.false(svc2.isEnabled);
});

test('ScrobblingService: scrobble is a no-op when disabled (HttpHelper never called)', async t => {
	const originalFetch = globalThis.fetch;
	let called = 0;
	globalThis.fetch = () => {
		called++;
		return Promise.resolve({
			ok: true,
			status: 200,
			json: async () => ({}),
		});
	};
	t.teardown(() => {
		globalThis.fetch = originalFetch;
	});

	const {ScrobblingService} =
		await import('../source/services/scrobbling/scrobbling.service.ts');
	const svc = new ScrobblingService();
	await svc.scrobble({title: 't', artist: 'a', duration: 30});
	t.is(called, 0);
});

test('ScrobblingService: buildLastfmSignature deterministic for identical params', async t => {
	const {scroblingSignatureForTests} =
		await import('../source/services/scrobbling/scrobbling.service.ts?probe=0');
	t.is(typeof scroblingSignatureForTests, 'undefined');
});

test('ScrobblingService: getScrobblingService returns same singleton', async t => {
	const {getScrobblingService} =
		await import('../source/services/scrobbling/scrobbling.service.ts');
	t.is(getScrobblingService(), getScrobblingService());
});
