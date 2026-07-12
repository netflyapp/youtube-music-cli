// Radio stations browser — browse and play online radio streams
import {Box, Text, useInput} from 'ink';
import {useState, useEffect, useMemo} from 'react';
import {useTheme} from '../../hooks/useTheme.ts';
import {useNavigation} from '../../hooks/useNavigation.ts';
import {usePlayer} from '../../hooks/usePlayer.ts';
import {getRadioStreamService} from '../../services/radio/radio-stream.service.ts';
import type {Station} from '../../types/station.types.ts';

type ViewMode = 'countries' | 'stations' | 'search';

export default function RadioStationsLayout() {
	const {theme} = useTheme();
	const {dispatch} = useNavigation();
	const {playRadioStation, state: playerState} = usePlayer();
	const [mode, setMode] = useState<ViewMode>('stations');
	const [stations, setStations] = useState<Station[]>([]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

	// Load all stations on mount
	useEffect(() => {
		let cancelled = false;
		const radioService = getRadioStreamService();

		radioService
			.fetchAllStations()
			.then(allStations => {
				if (!cancelled) {
					setStations(allStations);
					setIsLoading(false);
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(
						err instanceof Error ? err.message : 'Failed to load stations',
					);
					setIsLoading(false);
				}
			});

		return () => {
			cancelled = true;
		};
	}, []);

	// Filter stations by country
	const stationsByCountry = useMemo(() => {
		const map = new Map<string, Station[]>();
		for (const station of stations) {
			const country = station.country || 'Unknown';
			const list = map.get(country) ?? [];
			list.push(station);
			map.set(country, list);
		}

		return map;
	}, [stations]);

	const countryList = useMemo(
		() =>
			[...stationsByCountry.keys()].sort((a, b) => {
				// Poland first
				if (a === 'Poland') return -1;
				if (b === 'Poland') return 1;
				return a.localeCompare(b);
			}),
		[stationsByCountry],
	);

	// Filter stations when country is selected or search is used
	const filteredStations = useMemo(() => {
		if (mode === 'search' && searchQuery) {
			const q = searchQuery.toLowerCase();
			return stations.filter(
				s =>
					s.name.toLowerCase().includes(q) ||
					s.genre.toLowerCase().includes(q) ||
					s.country.toLowerCase().includes(q) ||
					s.tags.some(t => t.includes(q)),
			);
		}

		if (selectedCountry) {
			return stationsByCountry.get(selectedCountry) ?? [];
		}

		return stations;
	}, [selectedCountry, searchQuery, mode, stations, stationsByCountry]);



	const currentStations =
		mode === 'countries' && !selectedCountry
			? countryList
			: filteredStations;

	const isStationList = mode !== 'countries' || selectedCountry != null;

	useInput((input, key) => {
		if (key.escape) {
			if (mode === 'search') {
				setMode(selectedCountry ? 'stations' : 'countries');
				setSearchQuery('');
				setSelectedIndex(0);
				return;
			}

			if (selectedCountry) {
				setSelectedCountry(null);
				setSelectedIndex(0);
				return;
			}

			if (mode === 'countries') {
				dispatch({category: 'GO_BACK'});
				return;
			}

			dispatch({category: 'GO_BACK'});
			return;
		}

		if (input === '/' && mode !== 'search') {
			setMode('search');
			setSearchQuery('');
			setSelectedIndex(0);
			return;
		}

		if (mode === 'search') {
			if (key.return) {
				setMode(selectedCountry ? 'stations' : 'countries');
				setSelectedIndex(0);
				return;
			}

			if (input === 'backspace') {
				setSearchQuery(q => q.slice(0, -1));
				setSelectedIndex(0);
				return;
			}

			if (input.length === 1 && !key.ctrl && !key.meta) {
				setSearchQuery(q => q + input);
				setSelectedIndex(0);
				return;
			}

			return;
		}

		if (key.upArrow || input === 'k') {
			setSelectedIndex(i => Math.max(0, i - 1));
		} else if (key.downArrow || input === 'j') {
			setSelectedIndex(i =>
				Math.min(currentStations.length - 1, i + 1),
			);
		} else if (key.return) {
			if (!isStationList) {
				const country = currentStations[selectedIndex] as string;
				if (country) {
					setSelectedCountry(country);
					setSelectedIndex(0);
				}
			} else {
				const station = currentStations[selectedIndex] as Station;
				if (station) {
					playRadioStation(station);
				}
			}
		}
	});

	return (
		<Box flexDirection="column" padding={1}>
			{/* Header */}
			<Box marginBottom={1}>
				<Text color={theme.colors.primary} bold>
					{mode === 'search'
						? '🔍 Search Radio'
						: selectedCountry
							? `📻 ${selectedCountry}`
							: '📻 Radio Stations'}
				</Text>
				{playerState.radioStationName && (
					<Box marginLeft={2}>
						<Text color={theme.colors.success}>
							{'▶ '}
							{playerState.radioStationName}
						</Text>
					</Box>
				)}
			</Box>

			{/* Search bar */}
			{mode === 'search' && (
				<Box marginBottom={1}>
					<Text color={theme.colors.dim}>Search: </Text>
					<Text color={theme.colors.text}>{searchQuery || ''}</Text>
					{searchQuery.length === 0 && (
						<Text color={theme.colors.dim}>Type to search stations...</Text>
					)}
				</Box>
			)}

			{/* Loading */}
			{isLoading ? (
				<Text color={theme.colors.dim}>Loading radio stations...</Text>
			) : error ? (
				<Text color={theme.colors.error}>{error}</Text>
			) : currentStations.length === 0 ? (
				<Text color={theme.colors.dim}>No stations found</Text>
			) : isStationList ? (
				/* Station list */
				(filteredStations as Station[]).slice(0, 50).map((station, index) => {
					const isSelected = index === selectedIndex;
					const isCurrentlyPlaying =
						playerState.radioStationName === station.name;

					return (
						<Box key={station.id}>
							<Text
							color={
								isCurrentlyPlaying
									? theme.colors.success
									: isSelected
										? theme.colors.primary
										: theme.colors.dim
							}
							>
								{isCurrentlyPlaying
									? '🔊 '
									: isSelected
										? '▶ '
										: '  '}
							</Text>
							<Text
							color={
								isCurrentlyPlaying
									? theme.colors.success
									: isSelected
										? theme.colors.primary
										: theme.colors.text
							}
								bold={isSelected || isCurrentlyPlaying}
							>
								{station.name}
							</Text>
							<Text color={theme.colors.dim}>
								{' — '}
								{station.genre}
							</Text>
							<Text color={theme.colors.dim}>
								{' '}
								({station.country})
							</Text>
						</Box>
					);
				})
			) : (
				/* Country list */
				(currentStations as string[]).map((country, index) => {
					const isSelected = index === selectedIndex;
					const count = stationsByCountry.get(country)?.length ?? 0;

					return (
						<Box key={country}>
							<Text
								color={isSelected ? theme.colors.primary : theme.colors.dim}
							>
								{isSelected ? '▶ ' : '  '}
							</Text>
							<Text
								color={isSelected ? theme.colors.primary : theme.colors.text}
								bold={isSelected}
							>
								{country}
							</Text>
							<Text color={theme.colors.dim}> ({count} stations)</Text>
						</Box>
					);
				})
			)}

			{/* Help text */}
			<Box marginTop={1}>
				<Text color={theme.colors.dim}>
					{isStationList
						? '↑/↓ Navigate | Enter Play | / Search'
						: '↑/↓ Navigate | Enter Browse | / Search'}
					{' | Esc Back'}
				</Text>
			</Box>
		</Box>
	);
}
