import test from 'ava';

async function getService() {
	const {getNotificationService} =
		await import('../source/services/notification/notification.service.ts');
	return getNotificationService();
}

function withEnabled(service, value, run) {
	const original = service.isEnabled();
	service.setEnabled(value);
	try {
		return run();
	} finally {
		service.setEnabled(original);
	}
}

test('NotificationService: getInstance returns the same singleton', async t => {
	const a = await getService();
	const b = await getService();
	t.is(a, b);
});

test('NotificationService: starts disabled by default', async t => {
	const service = await getService();
	t.false(service.isEnabled());
});

test('NotificationService: setEnabled toggles the flag', async t => {
	const service = await getService();
	await withEnabled(service, true, () => {
		t.true(service.isEnabled());
	});
	await withEnabled(service, false, () => {
		t.false(service.isEnabled());
	});
});

test('NotificationService: notify is a no-op when disabled', async t => {
	const service = await getService();
	await withEnabled(service, false, async () => {
		await t.notThrowsAsync(async () => service.notify('hello', 'world'));
	});
});
