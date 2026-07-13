import {Action, ActionPanel, Icon, List, Toast, showToast} from '@raycast/api';
import {useEffect, useState} from 'react';
import {searchSongs, sendPlayerAction} from './client';
import type {SongSearchResult, Track} from './types';

export default function Search() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState<SongSearchResult[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string>();

	useEffect(() => {
		const normalizedQuery = query.trim();
		if (normalizedQuery.length < 2) return;

		let cancelled = false;
		const timeout = setTimeout(() => {
			setIsLoading(true);
			void searchSongs(normalizedQuery)
				.then(items => {
					if (cancelled) return;
					setResults(items);
					setError(undefined);
				})
				.catch((caught: unknown) => {
					if (cancelled) return;
					setResults([]);
					setError(caught instanceof Error ? caught.message : String(caught));
				})
				.finally(() => {
					if (!cancelled) setIsLoading(false);
				});
		}, 350);

		return () => {
			cancelled = true;
			clearTimeout(timeout);
		};
	}, [query]);

	const play = async (track: Track): Promise<void> => {
		const toast = await showToast({
			style: Toast.Style.Animated,
			title: `Playing ${track.title}`,
		});
		try {
			await sendPlayerAction({category: 'PLAY', track});
			toast.style = Toast.Style.Success;
			toast.title = `Playing ${track.title}`;
		} catch (caught) {
			toast.style = Toast.Style.Failure;
			toast.title = 'Could not play track';
			toast.message = caught instanceof Error ? caught.message : String(caught);
		}
	};

	return (
		<List
			filtering={false}
			isLoading={isLoading}
			onSearchTextChange={setQuery}
			searchBarPlaceholder="Search songs on YouTube Music..."
			throttle
		>
			{query.trim().length < 2 ? (
				<List.EmptyView
					icon={Icon.MagnifyingGlass}
					title="Search YouTube Music"
					description="Enter at least two characters."
				/>
			) : error ? (
				<List.EmptyView
					icon={Icon.ExclamationMark}
					title="Search failed"
					description={`${error}\n\nMake sure the player is running with ymc --web.`}
				/>
			) : (
				results.map(({data: track}) => {
					const artist =
						track.artists.map(item => item.name).join(', ') || 'Unknown artist';
					return (
						<List.Item
							id={track.videoId}
							key={track.videoId}
							icon={`https://img.youtube.com/vi/${track.videoId}/mqdefault.jpg`}
							title={track.title}
							subtitle={artist}
							accessories={track.album ? [{text: track.album.name}] : undefined}
							actions={
								<ActionPanel>
									<Action
										title="Play"
										icon={Icon.Play}
										onAction={() => play(track)}
									/>
									<Action.OpenInBrowser
										title="Open on YouTube Music"
										url={`https://music.youtube.com/watch?v=${track.videoId}`}
									/>
									<Action.CopyToClipboard
										title="Copy Video ID"
										content={track.videoId}
									/>
								</ActionPanel>
							}
						/>
					);
				})
			)}
		</List>
	);
}
