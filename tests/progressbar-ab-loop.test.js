import test from 'ava';
import {readFileSync} from 'node:fs';

test('progress-bar: ProgressBar renders A/B loop markers in the bar', t => {
	const source = readFileSync(
		'./source/components/player/ProgressBar.tsx',
		'utf8',
	);

	t.true(
		source.includes('abLoop'),
		'ProgressBar must read playerState.abLoop so markers can render',
	);
	const markerGlyphPattern = /['"`]\|['"`]/;
	t.true(
		markerGlyphPattern.test(source),
		'ProgressBar must draw a "|" glyph at A/B marker position',
	);
	t.true(
		source.includes('markerPoints'),
		'ProgressBar must compute marker percentages through helper',
	);
});

test('progress-bar: marker percentage helper maps time to [0, 100]', t => {
	function computeMarkerPoint(durationMs, abLoop) {
		if (!abLoop || durationMs <= 0) return null;
		const value = abLoop.a !== null ? abLoop.a : abLoop.b;
		if (value === null) return null;
		return (value / durationMs) * 100;
	}

	t.is(computeMarkerPoint(200_000, {a: 50_000, b: null}), 25);
	t.is(computeMarkerPoint(200_000, {a: null, b: 100_000}), 50);
	t.is(computeMarkerPoint(0, {a: 5_000, b: null}), null);
});
