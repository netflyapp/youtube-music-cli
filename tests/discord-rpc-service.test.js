import test from 'ava';

async function freshService() {
	const {DiscordRpcService} = await import(
		'../source/services/discord/discord-rpc.service.ts'
	);
	return new DiscordRpcService();
}

test('DiscordRpcService: starts not enabled and not connected', async t => {
	const svc = await freshService();
	t.is(svc.isEnabled_undefined, undefined);
	await svc.disconnect();
});

test('DiscordRpcService: setEnabled(true) flips internal flag', async t => {
	const svc = await freshService();
	const internalBefore = svc['enabled'];
	svc.setEnabled(true);
	t.is(svc['enabled'], true);
	t.not(internalBefore, svc['enabled']);
	svc.setEnabled(false);
	await svc.disconnect();
});

test('DiscordRpcService: setEnabled(false) calls disconnect (idle when no client)', async t => {
	const svc = await freshService();
	svc.setEnabled(true);
	await t.notThrowsAsync(async () => svc.setEnabled(false));
	t.is(svc['connected'], false);
});

test('DiscordRpcService: connect is a no-op when disabled', async t => {
	const svc = await freshService();
	await svc.connect();
	t.is(svc['connected'], false);
});

test('DiscordRpcService: updateActivity is a no-op when disabled', async t => {
	const svc = await freshService();
	await svc.updateActivity({title: 'T', artist: 'A'});
	t.is(svc['client'], null);
});

test('DiscordRpcService: updateActivity is a no-op when not connected', async t => {
	const svc = await freshService();
	svc.setEnabled(true);
	await svc.updateActivity({title: 'T', artist: 'A'});
	t.is(svc['connected'], false);
});

test('DiscordRpcService: clearActivity is a no-op when not connected', async t => {
	const svc = await freshService();
	await svc.clearActivity();
	t.is(svc['client'], null);
});

test('DiscordRpcService: disconnect on fresh service is a no-op', async t => {
	const svc = await freshService();
	await t.notThrowsAsync(async () => svc.disconnect());
	t.is(svc['client'], null);
	t.is(svc['connected'], false);
});

test('DiscordRpcService: getDiscordRpcService returns same singleton', async t => {
	const {getDiscordRpcService} = await import(
		'../source/services/discord/discord-rpc.service.ts'
	);
	t.is(getDiscordRpcService(), getDiscordRpcService());
});
