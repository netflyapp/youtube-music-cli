import test from 'ava';
import {readFileSync} from 'node:fs';

test('player service: sendIpcCommand wraps ipcSocket.write in try/catch', t => {
	const source = readFileSync(
		'./source/services/player/player.service.ts',
		'utf8',
	);

	const functionMatch = source.match(
		/private sendIpcCommand\(command: unknown\[\]\): void \{[^\n]*\n[\s\S]*?\n\t\}/,
	);

	t.truthy(functionMatch, 'sendIpcCommand function body should be locatable');

	const body = functionMatch ? functionMatch[0] : '';
	const writeIdx = body.indexOf('this.ipcSocket.write');
	t.truthy(writeIdx > 0, 'sendIpcCommand must call this.ipcSocket.write');

	const before = body.slice(0, writeIdx);
	const after = body.slice(writeIdx);

	t.true(
		before.includes('try {'),
		`ipcSocket.write must be inside a try block. Saw "..." before the write: ${before.slice(-60)}`,
	);

	const closeTry = after.indexOf('} catch');
	t.truthy(closeTry >= 0, 'ipcSocket.write must have a matching catch block');

	const between = after.slice(0, closeTry);
	t.true(
		!between.includes('return') ||
			(between.includes('logger.error') &&
				after.slice(closeTry).includes('return')),
		`catch handler must call logger.error and early-return. Saw: ${
			after.slice(closeTry, closeTry + 200)
		}`,
	);
});
