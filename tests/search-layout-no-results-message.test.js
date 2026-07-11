import test from 'ava';
import {readFileSync} from 'node:fs';

test('search-layout: distinguishes "no results" from "all results filtered out"', t => {
	const source = readFileSync(
		'./source/components/layouts/SearchLayout.tsx',
		'utf8',
	);
	t.true(
		source.includes('No results found'),
		'baseline "no results found" copy must remain',
	);
	t.true(
		source.includes('active filters'),
		'filter-only zero-result message must mention active filters',
	);
	t.true(
		source.includes('rawResults.length > 0') &&
			source.includes('filteredResults.length === 0'),
		'message must switch when raw results exist but the filter pipeline dropped them',
	);
});
