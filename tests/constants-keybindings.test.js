import test from 'ava';
import {KEYBINDINGS} from '../source/utils/constants.ts';

/**
 * @param {Record<string, ReadonlyArray<string>>} bindings
 * @returns {string}
 */
function findKeybindingConflictsReport(bindings) {
	const duplicates = [];
	const seen = new Map();
	for (const [action, keys] of Object.entries(bindings)) {
		for (const key of keys) {
			const owners = seen.get(key) ?? [];
			owners.push(action);
			seen.set(key, owners);
		}
	}

	for (const [key, owners] of seen.entries()) {
		if (owners.length > 1) {
			duplicates.push(`  "${key}" -> ${owners.join(', ')}`);
		}
	}

	return duplicates.length === 0
		? ''
		: `Conflicting keybindings detected:\n${duplicates.join('\n')}`;
}

function keysForAction(actionName) {
	return (
		/** @type {ReadonlyArray<string>} */ (
			/** @type {Record<string, ReadonlyArray<string>>} */ (KEYBINDINGS)[
				actionName
			]
		) ?? []
	);
}

test('KEYBINDINGS: every key triggers exactly one action', t => {
	const report = findKeybindingConflictsReport(KEYBINDINGS);
	t.is(report, '', report);
});

test('KEYBINDINGS: AI_CHAT and ADD_TO_PLAYLIST do not share keys', t => {
	const chatKeys = keysForAction('AI_CHAT');
	const playlistKeys = keysForAction('ADD_TO_PLAYLIST');
	const overlap = chatKeys.filter(key => playlistKeys.includes(key));
	t.deepEqual(overlap, [], `Actions share keys: ${overlap.join(', ')}`);
});

test('KEYBINDINGS: BACK and CLEAR_SEARCH resolve conflicting escape', t => {
	const backKeys = keysForAction('BACK');
	const clearKeys = keysForAction('CLEAR_SEARCH');
	const overlap = backKeys.filter(key => clearKeys.includes(key));
	t.deepEqual(
		overlap,
		[],
		`BACK and CLEAR_SEARCH share: ${overlap.join(', ')}`,
	);
	t.true(
		clearKeys.includes('escape'),
		'CLEAR_SEARCH must keep escape for in-input clearing',
	);
	t.true(
		!backKeys.includes('escape'),
		'BACK should no longer own escape after conflict resolution',
	);
});
