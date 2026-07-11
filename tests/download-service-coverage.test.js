import test from 'ava';

function getSampleTrack(videoId, extra = {}) {
	return {
		videoId,
		title: `Track ${videoId}`,
		artists: [{artistId: 'artist1', name: 'Artist'}],
		duration: 200,
		...extra,
	};
}

test('download service: resolvePlaylistTarget dedupes by videoId', async t => {
	const {getDownloadService} =
		await import('../source/services/download/download.service.ts');

	const trackA = getSampleTrack('abc');
	const trackB = getSampleTrack('def', {title: 'Track def'});
	const duplicateA = getSampleTrack('abc', {title: 'Same Video Duplicate'});

	const service = getDownloadService();
	const resolved = service.resolvePlaylistTarget({
		name: 'My Playlist',
		tracks: [trackA, trackB, duplicateA],
	});

	t.is(resolved.name, 'My Playlist');
	t.is(resolved.tracks.length, 2);
	t.deepEqual(
		resolved.tracks.map(track => track.videoId),
		['abc', 'def'],
	);
});

test('download service: resolvePlaylistTarget ignores tracks without videoId', async t => {
	const {getDownloadService} =
		await import('../source/services/download/download.service.ts');

	const validTrack = getSampleTrack('valid123');
	const brokenTrack = {title: 'No video id', artists: [], duration: 0};

	const service = getDownloadService();
	const resolved = service.resolvePlaylistTarget({
		name: 'Mixed',
		tracks: [validTrack, brokenTrack],
	});

	t.is(resolved.tracks.length, 1);
	t.is(resolved.tracks[0].videoId, 'valid123');
});

test('download service: resolvePlaylistTarget returns empty list for empty playlist', async t => {
	const {getDownloadService} =
		await import('../source/services/download/download.service.ts');

	const service = getDownloadService();
	const resolved = service.resolvePlaylistTarget({
		name: 'Empty',
		tracks: [],
	});

	t.is(resolved.name, 'Empty');
	t.deepEqual(resolved.tracks, []);
});

test('download service: resolveSearchTarget rejects missing artist name', async t => {
	const {getDownloadService} =
		await import('../source/services/download/download.service.ts');

	const service = getDownloadService();

	await t.throwsAsync(
		async () =>
			service.resolveSearchTarget({
				type: 'artist',
				data: {name: ''},
			}),
		{message: /Artist name is missing\./},
	);
});

test('download service: resolveSearchTarget for album is not supported', async t => {
	const {getDownloadService} =
		await import('../source/services/download/download.service.ts');

	const service = getDownloadService();

	await t.throwsAsync(
		async () =>
			service.resolveSearchTarget({
				type: 'album',
				data: {name: 'Hits Album', tracks: []},
			}),
		{message: /Downloads are supported for songs, artists, and playlists\./},
	);
});

test('download service: activeDownload guard rejects second concurrent call', async t => {
	const {getDownloadService} =
		await import('../source/services/download/download.service.ts');

	const service = getDownloadService();
	const originalActive = /** @type {boolean} */ (
		/** @type {unknown} */ (service)['activeDownload']
	);

	try {
		Object.defineProperty(service, 'activeDownload', {
			value: true,
			writable: true,
			configurable: true,
		});

		await t.throwsAsync(async () => service.downloadTracks([]), {
			message: /A download is already in progress/,
		});
	} finally {
		Object.defineProperty(service, 'activeDownload', {
			value: originalActive,
			writable: true,
			configurable: true,
		});
	}
});
