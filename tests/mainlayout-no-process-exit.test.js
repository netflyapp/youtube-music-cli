import test from 'ava';
import {readFileSync} from 'node:fs';

function assertNoProcessExitInReactTree(t, filePath) {
	const source = readFileSync(filePath, 'utf8');
	const stripped = source
		.replace(/\/\/.*$/gm, '')
		.replace(/\/\*[\s\S]*?\*\//g, '');
	t.false(
		stripped.includes('process.exit'),
		`${filePath} must not call process.exit inside the React tree; use useApp().exit() instead so Ink can unmount the tree before the process leaves.`,
	);
}

test('React tree: MainLayout does not call process.exit directly', t => {
	assertNoProcessExitInReactTree(
		t,
		'./source/components/layouts/MainLayout.tsx',
	);
});
