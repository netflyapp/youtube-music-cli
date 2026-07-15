import {Action, ActionPanel, Icon, List, Toast, showToast} from '@raycast/api';
import {useEffect, useState} from 'react';
import {getFavorites, sendPlayerAction} from './client';
import type {Track} from './types';

export default function Favorites() {
	const [tracks, setTracks] = useState<Track[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string>();

	const fetchFavorites = async () => {
		setIsLoading(true);
		try {
			const items = await getFavorites();
			setTracks(items);
			setError(undefined);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : String(caught));
		} finally {
			setIsLoading(false);
		}
	};

	useEffect(() => {
		void fetchFavorites();
	}, []);

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

	const toggleFavorite = async (track: Track): Promise<void> => {
		const toast = await showToast({
			style: Toast.Style.Animated,
			title: `Removing ${track.title} from favorites`,
		});
		try {
			await sendPlayerAction({category: 'TOGGLE_FAVORITE', track});
			toast.style = Toast.Style.Success;
			toast.title = `Removed from favorites`;
			await fetchFavorites();
		} catch (caught) {
			toast.style = Toast.Style.Failure;
			toast.title = 'Failed to toggle favorite';
			toast.message = caught instanceof Error ? caught.message : String(caught);
		}
	};

	if (error) {
		return (
			<List isLoading={isLoading}>
				<List.EmptyView
					icon={Icon.ExclamationMark}
					title="YouTube Music CLI is unavailable"
					description={`${error}\n\nStart it with: ymc --web`}
					actions={
						<ActionPanel>
							<Action
								title="Retry"
								icon={Icon.ArrowClockwise}
								onAction={fetchFavorites}
							/>
						</ActionPanel>
					}
				/>
			</List>
		);
	}

	return (
		<List
			isLoading={isLoading}
			navigationTitle="Favorites — YouTube Music CLI"
			searchBarPlaceholder="Filter favorites..."
		>
			{tracks.length === 0 ? (
				<List.EmptyView
					icon={Icon.HeartDisabled}
					title="No favorites yet"
					description="Add favorites from the Player Controller or Search."
				/>
			) : (
				tracks.map(track => {
					const artist =
						track.artists.map(a => a.name).join(', ') || 'Unknown artist';
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
									<Action
										title="Remove from Favorites"
										icon={Icon.HeartDisabled}
										onAction={() => toggleFavorite(track)}
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
