import test from 'ava';

test('CacheService: set + get round trip', async t => {
	const {CacheService} =
		await import('../source/services/cache/cache.service.ts');
	const cache = new CacheService();
	cache.set('k1', 'v1');
	t.is(cache.get('k1'), 'v1');
});

test('CacheService: get returns null for missing key', async t => {
	const {CacheService} =
		await import('../source/services/cache/cache.service.ts');
	const cache = new CacheService();
	t.is(cache.get('missing'), null);
});

async function tick(ms = 5) {
	await new Promise(resolve => setTimeout(resolve, ms));
}

test('CacheService: TTL expires entries after their lifetime', async t => {
	const {CacheService} =
		await import('../source/services/cache/cache.service.ts');
	const cache = new CacheService();
	cache.set('k1', 'v1', 1);
	t.is(cache.get('k1'), 'v1');
	await tick(15);
	t.is(cache.get('k1'), null);
});

test('CacheService: LRU evicts least-recently-accessed when over capacity', async t => {
	const {CacheService} =
		await import('../source/services/cache/cache.service.ts');
	const cache = new CacheService(2, 60 * 1000);
	cache.set('a', 1);
	await tick();
	cache.set('b', 2);
	await tick();
	cache.get('a');
	await tick();
	cache.set('c', 3);
	t.is(cache.get('a'), 1);
	t.is(cache.get('b'), null);
	t.is(cache.get('c'), 3);
});

test('CacheService: re-set invalidates LRU position so the older key can be evicted next', async t => {
	const {CacheService} =
		await import('../source/services/cache/cache.service.ts');
	const cache = new CacheService(2, 60 * 1000);
	cache.set('a', 1);
	await tick();
	cache.set('b', 2);
	await tick();
	cache.set('a', 11);
	await tick();
	cache.set('c', 3);
	t.is(cache.get('a'), 11);
	t.is(cache.get('b'), null);
	t.is(cache.get('c'), 3);
});

test('CacheService: has returns false after expiry', async t => {
	const {CacheService} =
		await import('../source/services/cache/cache.service.ts');
	const cache = new CacheService();
	cache.set('k1', 'v1', 1);
	t.true(cache.has('k1'));
	await tick(15);
	t.false(cache.has('k1'));
});

test('CacheService: delete removes single entry without clearing others', async t => {
	const {CacheService} =
		await import('../source/services/cache/cache.service.ts');
	const cache = new CacheService();
	cache.set('a', 1);
	cache.set('b', 2);
	cache.delete('a');
	t.is(cache.get('a'), null);
	t.is(cache.get('b'), 2);
});

test('CacheService: clear empties the cache', async t => {
	const {CacheService} =
		await import('../source/services/cache/cache.service.ts');
	const cache = new CacheService();
	cache.set('a', 1);
	cache.set('b', 2);
	cache.clear();
	t.is(cache.size, 0);
	t.is(cache.get('a'), null);
});

test('CacheService: getSearchCache returns the same singleton', async t => {
	const {getSearchCache} =
		await import('../source/services/cache/cache.service.ts');
	t.is(getSearchCache(), getSearchCache());
});

test('CacheService: size reflects the number of stored entries', async t => {
	const {CacheService} =
		await import('../source/services/cache/cache.service.ts');
	const cache = new CacheService();
	t.is(cache.size, 0);
	cache.set('a', 1);
	t.is(cache.size, 1);
	cache.set('b', 2);
	t.is(cache.size, 2);
});
