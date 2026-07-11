import test from 'ava';

test('KEYBINDINGS: CLEAR_QUEUE key is bound to a non-empty array', async t => {
	const {KEYBINDINGS} = await import(
		'../source/utils/constants.ts'
	);
	t.truthy(KEYBINDINGS.CLEAR_QUEUE);
	t.true(KEYBINDINGS.CLEAR_QUEUE.length > 0);
});
