import test from 'ava';

test('parseKeyName maps arrow keys and control keys', async t => {
	const {parseKeyName} =
		await import('../source/immersive/input/key-parser.ts');

	t.is(parseKeyName('\x1B[A'), 'up');
	t.is(parseKeyName('\x1B[B'), 'down');
	t.is(parseKeyName('\x1B[C'), 'right');
	t.is(parseKeyName('\x1B[D'), 'left');
	t.is(parseKeyName(' '), ' ');
	t.is(parseKeyName('\x03'), 'Ctrl+C');
	t.is(parseKeyName('/'), '/');
	t.is(parseKeyName('\r'), 'enter');
	t.is(parseKeyName('S'), 'Shift+S');
	t.is(parseKeyName('s'), 's');
	t.is(parseKeyName('\x1c'), 'Ctrl+,');
});

test('AudioCollector processes frequency bands', async t => {
	const {AudioCollector} =
		await import('../source/immersive/visualizer/audio-collector.ts');

	const collector = new AudioCollector(256);
	const samples = new Float32Array(256);
	for (let i = 0; i < samples.length; i++) {
		samples[i] = Math.sin(i / 10);
	}

	const processed = collector.processAudioData(samples);
	const bands = collector.getFrequencyBands(processed);

	t.true(processed.length > 0);
	t.true(bands.bass >= 0);
	t.true(bands.treble >= 0);
});

test('FrameBuffer setText and clear work', async t => {
	const {FrameBuffer} =
		await import('../source/immersive/renderer/frame-buffer.ts');

	const fb = new FrameBuffer(20, 5);
	fb.setText(2, 1, 'Hello', null, null, {bold: true});
	t.is(fb.getCell(2, 1)?.char, 'H');
	t.is(fb.getCell(2, 1)?.bold, true);

	fb.clear();
	t.is(fb.getCell(2, 1)?.char, ' ');
});

test('BrailleCanvas accumulates dots in the same cell', async t => {
	const {FrameBuffer} =
		await import('../source/immersive/renderer/frame-buffer.ts');
	const {BrailleCanvas} =
		await import('../source/immersive/renderer/braille-canvas.ts');

	const fb = new FrameBuffer(10, 10);
	const canvas = new BrailleCanvas(fb);

	canvas.setPixel(0, 0, [255, 0, 0]);
	canvas.setPixel(1, 0, [0, 255, 0]);

	const cell = fb.getCell(0, 0);
	t.not(cell?.char, ' ');
	t.not(cell?.char, String.fromCharCode(0x2800));
});

test('queue-state advances and rewinds queue', async t => {
	const {advanceQueue, createInitialImmersiveState, previousQueue, setQueue} =
		await import('../source/immersive/state/queue-state.ts');

	const state = createInitialImmersiveState();
	setQueue(state, [
		{videoId: 'a', title: 'A', artists: []},
		{videoId: 'b', title: 'B', artists: []},
		{videoId: 'c', title: 'C', artists: []},
	]);

	t.is(state.currentTrack?.videoId, 'a');
	t.is(advanceQueue(state)?.videoId, 'b');
	t.is(advanceQueue(state)?.videoId, 'c');
	t.is(advanceQueue(state), null);

	state.currentTime = 1;
	state.queueIndex = 2;
	state.currentTrack = state.queue[2] ?? null;
	t.is(previousQueue(state)?.videoId, 'b');
});

test('queue-state supports shuffle and repeat-all', async t => {
	const {advanceQueue, createInitialImmersiveState, setQueue} =
		await import('../source/immersive/state/queue-state.ts');

	const state = createInitialImmersiveState({shuffle: true});
	setQueue(state, [
		{videoId: 'a', title: 'A', artists: []},
		{videoId: 'b', title: 'B', artists: []},
		{videoId: 'c', title: 'C', artists: []},
	]);

	const first = advanceQueue(state)?.videoId;
	t.not(first, 'a');
	t.true(['b', 'c'].includes(first ?? ''));

	state.shuffle = false;
	state.repeat = 'all';
	state.queueIndex = 2;
	state.currentTrack = state.queue[2] ?? null;
	t.is(advanceQueue(state)?.videoId, 'a');
});

test('queue-state cycles repeat modes', async t => {
	const {createInitialImmersiveState, cycleRepeat} =
		await import('../source/immersive/state/queue-state.ts');

	const state = createInitialImmersiveState();
	t.is(cycleRepeat(state), 'all');
	t.is(cycleRepeat(state), 'one');
	t.is(cycleRepeat(state), 'off');
});

test('settings overlay navigates and cycles rows', async t => {
	const {
		closeSettingsOverlay,
		createSettingsOverlayState,
		handleSettingsInput,
		openSettingsOverlay,
	} = await import('../source/immersive/ui/settings-overlay.ts');

	const overlay = createSettingsOverlayState();
	openSettingsOverlay(overlay);
	t.true(overlay.active);

	t.is(handleSettingsInput(overlay, 'down', 5), 'none');
	t.is(overlay.selectedIndex, 1);
	t.is(handleSettingsInput(overlay, 'enter', 5), 'cycle');
	t.is(handleSettingsInput(overlay, 'escape', 5), 'close');
	t.false(overlay.active);

	closeSettingsOverlay(overlay);
});

test('HybridAudioSource reacts to playback state', async t => {
	const {HybridAudioSource} =
		await import('../source/immersive/visualizer/hybrid-audio.ts');

	const source = new HybridAudioSource(64);

	for (let i = 0; i < 20; i++) {
		source.update(
			{currentTime: i, duration: 180, isPlaying: true, volume: 80},
			16,
		);
	}
	const playing = source.generateSamples();

	for (let i = 0; i < 20; i++) {
		source.update(
			{currentTime: i, duration: 180, isPlaying: false, volume: 80},
			16,
		);
	}
	const paused = source.generateSamples();

	const playingEnergy = playing.reduce((sum, value) => sum + value, 0);
	const pausedEnergy = paused.reduce((sum, value) => sum + value, 0);
	t.true(playingEnergy >= pausedEnergy);
});

test('layout helpers compute regions and progress bars', async t => {
	const {
		buildModeStatusLine,
		buildPlayerShortcutLine,
		buildProgressBar,
		buildVolumeBar,
		computeLayout,
	} = await import('../source/immersive/ui/layout.ts');

	const layout = computeLayout(100, 30);
	t.true(layout.vizH >= 7);
	t.true(layout.vizW > 0);
	t.true(layout.nowPlayingW > 0);

	const {bar} = buildProgressBar(0.5, 10);
	t.is(bar.length, 10);
	t.true(bar.includes('█'));
	t.true(bar.includes('░'));

	const vol = buildVolumeBar(50, 8);
	t.is(vol.length, 8);

	const modeLine = buildModeStatusLine({
		shuffle: true,
		repeat: 'all',
		isDiscoMode: false,
	});
	t.true(modeLine.includes('Shuffle ON'));
	t.true(modeLine.includes('Repeat ALL'));

	const shortcuts = buildPlayerShortcutLine(120);
	t.true(shortcuts.includes('[Shift+S] Shuffle'));
	t.true(shortcuts.includes('[Ctrl+,] Settings'));
});

test('search overlay handles query and results phases', async t => {
	const {
		closeSearchOverlay,
		createSearchOverlayState,
		handleSearchQueryInput,
		handleSearchResultsInput,
		openSearchOverlay,
		setSearchResults,
	} = await import('../source/immersive/ui/search-overlay.ts');

	const overlay = createSearchOverlayState();
	openSearchOverlay(overlay);
	t.true(overlay.active);
	t.is(overlay.phase, 'query');

	t.is(handleSearchQueryInput(overlay, 't'), 'none');
	t.is(handleSearchQueryInput(overlay, 'e'), 'none');
	t.is(handleSearchQueryInput(overlay, 's'), 'none');
	t.is(handleSearchQueryInput(overlay, 't'), 'none');
	t.is(overlay.query, 'test');
	t.is(handleSearchQueryInput(overlay, 'enter'), 'submit');

	setSearchResults(overlay, [
		{type: 'song', data: {videoId: 'a', title: 'Alpha', artists: []}},
		{type: 'album', data: {albumId: 'b', name: 'Beta', artists: []}},
	]);
	t.is(overlay.phase, 'results');
	t.is(overlay.selectedIndex, 0);

	t.is(handleSearchResultsInput(overlay, 'down'), 'none');
	t.is(overlay.selectedIndex, 1);
	t.is(handleSearchResultsInput(overlay, 'enter'), 'play');
	t.is(handleSearchResultsInput(overlay, 'm'), 'mix');
	t.is(handleSearchResultsInput(overlay, 'f'), 'favorite');

	t.is(handleSearchResultsInput(overlay, 'escape'), 'back');
	t.is(overlay.phase, 'query');

	closeSearchOverlay(overlay);
	t.false(overlay.active);
	t.is(handleSearchQueryInput(overlay, 'escape'), 'cancel');
});

test('library overlay navigates menu and playlists', async t => {
	const {
		closeLibraryOverlay,
		createLibraryOverlayState,
		handleLibraryMenuInput,
		handleLibraryPlaylistInput,
		openLibraryMenu,
		openPlaylistPicker,
	} = await import('../source/immersive/ui/library-overlay.ts');

	const overlay = createLibraryOverlayState();
	openLibraryMenu(overlay);
	t.true(overlay.active);
	t.is(overlay.view, 'menu');

	t.is(handleLibraryMenuInput(overlay, 'down'), 'none');
	t.is(overlay.selectedIndex, 1);
	t.is(handleLibraryMenuInput(overlay, 'enter'), 'menu_select');

	openPlaylistPicker(overlay);
	t.is(overlay.view, 'playlists');
	t.is(handleLibraryPlaylistInput(overlay, 'down', 3), 'none');
	t.is(overlay.selectedIndex, 1);
	t.is(handleLibraryPlaylistInput(overlay, 'escape', 3), 'back_to_menu');
	t.is(overlay.view, 'menu');

	closeLibraryOverlay(overlay);
	t.false(overlay.active);
});

test('playback-actions dedupe tracks and favorites manager toggles', async t => {
	const {dedupeTracks, FavoritesManager} =
		await import('../source/immersive/actions/playback-actions.ts');

	const deduped = dedupeTracks([
		{videoId: 'a', title: 'A', artists: []},
		{videoId: 'a', title: 'A duplicate', artists: []},
		{videoId: 'b', title: 'B', artists: []},
	]);
	t.is(deduped.length, 2);

	const manager = new FavoritesManager();
	manager['tracks'] = [];
	manager['loaded'] = true;

	const track = {videoId: 'x', title: 'Song', artists: []};
	t.false(manager.isFavorite('x'));
	const added = await manager.toggle(track);
	t.true(added);
	t.true(manager.isFavorite('x'));
	const removed = await manager.toggle(track);
	t.false(removed);
	t.false(manager.isFavorite('x'));
});

test('getSearchResultLabel and prefix format results', async t => {
	const {getSearchResultLabel, getSearchResultPrefix} =
		await import('../source/immersive/actions/playback-actions.ts');

	t.is(getSearchResultPrefix('song'), '♪');
	t.is(getSearchResultPrefix('album'), '◎');
	t.is(
		getSearchResultLabel({
			type: 'song',
			data: {videoId: '1', title: 'Hello', artists: []},
		}),
		'Hello',
	);
});
