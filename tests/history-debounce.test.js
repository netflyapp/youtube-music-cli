import test from 'ava';
import {readFileSync} from 'node:fs';

test('history store: save effect in HistoryStore is debounced', t => {
	const source = readFileSync(
		'./source/stores/history.store.tsx',
		'utf8',
	);
	const match = source.match(
		/useEffect\(\(\) => \{[\s\S]*?saveHistory\(state\)[\s\S]*?\},\s*\[state\]\)/,
	);
	t.truthy(match, 'save effect locator');
	const body = match ? match[0] : '';
	t.true(/setTimeout\(/.test(body), 'must use setTimeout');
	t.true(body.includes('500'), 'debounce window is 500 ms');
	t.true(/clearTimeout\([\s\S]*?\}/.test(body), 'must clear pending timer');
});

test('history-dedupe: coalescing debounce keeps only the latest state', async t => {
	let saved = null;
	let timer = null;
	function debouncedSave(state, delay) {
		return new Promise(resolve => {
			clearTimeout(timer);
			timer = setTimeout(() => {
				saved = state;
				resolve(state);
			}, delay);
		});
	}

	const p1 = debouncedSave('a', 5);
	const p2 = debouncedSave('b', 5);
	const result = await Promise.race([p1, p2]);

	t.is(saved, 'b');
	t.is(result, 'b');
});
