import {
	Action,
	ActionPanel,
	Color,
	Icon,
	List,
	Toast,
	openExtensionPreferences,
	showToast,
} from '@raycast/api';
import {useCallback, useEffect, useState} from 'react';
import {getPlayerState, sendPlayerAction} from './client';
import type {PlayerAction, PlayerState} from './types';

const EMPTY_STATE: PlayerState = {
	currentTrack: null,
	isPlaying: false,
	volume: 70,
	progress: 0,
	duration: 0,
	repeat: 'off',
	shuffle: false,
	isLoading: false,
	error: null,
};

function formatTime(seconds: number): string {
	if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
	const wholeSeconds = Math.floor(seconds);
	return `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, '0')}`;
}

export default function Controller() {
	const [state, setState] = useState<PlayerState>(EMPTY_STATE);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string>();

	const refresh = useCallback(async (): Promise<void> => {
		setIsLoading(true);
		try {
			const update = await getPlayerState();
			setState(current => ({...current, ...update}));
			setError(undefined);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : String(caught));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		let cancelled = false;

		void getPlayerState()
			.then(update => {
				if (cancelled) return;
				setState(current => ({...current, ...update}));
				setError(undefined);
			})
			.catch((caught: unknown) => {
				if (!cancelled) {
					setError(caught instanceof Error ? caught.message : String(caught));
				}
			})
			.finally(() => {
				if (!cancelled) setIsLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, []);

	const run = useCallback(
		async (action: PlayerAction, title: string): Promise<void> => {
			const toast = await showToast({style: Toast.Style.Animated, title});
			try {
				const update = await sendPlayerAction(action);
				setState(current => ({...current, ...update}));
				toast.style = Toast.Style.Success;
				toast.title = title;
			} catch (caught) {
				toast.style = Toast.Style.Failure;
				toast.title = 'Player command failed';
				toast.message =
					caught instanceof Error ? caught.message : String(caught);
			}
		},
		[],
	);

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
								onAction={refresh}
							/>
							<Action
								title="Open Extension Preferences"
								icon={Icon.Gear}
								onAction={openExtensionPreferences}
							/>
						</ActionPanel>
					}
				/>
			</List>
		);
	}

	const track = state.currentTrack;
	const artist =
		track?.artists.map(item => item.name).join(', ') || 'Unknown artist';
	const thumbnail = track
		? `https://img.youtube.com/vi/${track.videoId}/hqdefault.jpg`
		: Icon.Music;

	return (
		<List
			isLoading={isLoading}
			isShowingDetail
			navigationTitle="YouTube Music CLI"
		>
			{!track ? (
				<List.EmptyView
					icon={Icon.Music}
					title="Nothing is playing"
					description="Use Search and Play in Raycast or select a track in the CLI."
					actions={
						<ActionPanel>
							<Action
								title="Refresh"
								icon={Icon.ArrowClockwise}
								onAction={refresh}
							/>
						</ActionPanel>
					}
				/>
			) : (
				<List.Item
					id={track.videoId}
					icon={thumbnail}
					title={track.title}
					subtitle={artist}
					detail={
						<List.Item.Detail
							markdown={`![${track.title}](${thumbnail})\n\n# ${track.title}\n\n${artist}`}
							metadata={
								<List.Item.Detail.Metadata>
									<List.Item.Detail.Metadata.Label
										title="Status"
										text={state.isPlaying ? 'Playing' : 'Paused'}
										icon={state.isPlaying ? Icon.Play : Icon.Pause}
									/>
									<List.Item.Detail.Metadata.Label
										title="Album"
										text={track.album?.name ?? '—'}
									/>
									<List.Item.Detail.Metadata.Label
										title="Position"
										text={`${formatTime(state.progress)} / ${formatTime(state.duration || track.duration || 0)}`}
									/>
									<List.Item.Detail.Metadata.Label
										title="Volume"
										text={`${state.volume}%`}
									/>
									<List.Item.Detail.Metadata.TagList title="Modes">
										<List.Item.Detail.Metadata.TagList.Item
											text={`Repeat: ${state.repeat}`}
											color={
												state.repeat === 'off'
													? Color.SecondaryText
													: Color.Blue
											}
										/>
										<List.Item.Detail.Metadata.TagList.Item
											text={state.shuffle ? 'Shuffle on' : 'Shuffle off'}
											color={state.shuffle ? Color.Purple : Color.SecondaryText}
										/>
									</List.Item.Detail.Metadata.TagList>
								</List.Item.Detail.Metadata>
							}
						/>
					}
					actions={
						<ActionPanel>
							<Action
								title={state.isPlaying ? 'Pause' : 'Resume'}
								icon={state.isPlaying ? Icon.Pause : Icon.Play}
								onAction={() =>
									run(
										{category: state.isPlaying ? 'PAUSE' : 'RESUME'},
										state.isPlaying ? 'Playback paused' : 'Playback resumed',
									)
								}
							/>
							<Action
								title="Next Track"
								icon={Icon.Forward}
								shortcut={{modifiers: ['cmd'], key: 'arrowRight'}}
								onAction={() =>
									run({category: 'NEXT'}, 'Skipped to next track')
								}
							/>
							<Action
								title="Previous Track"
								icon={Icon.Rewind}
								shortcut={{modifiers: ['cmd'], key: 'arrowLeft'}}
								onAction={() =>
									run({category: 'PREVIOUS'}, 'Returned to previous track')
								}
							/>
							<ActionPanel.Section title="Playback">
								<Action
									title="Add to Favorites"
									icon={Icon.Heart}
									onAction={() =>
										run({category: 'TOGGLE_FAVORITE'}, 'Toggled favorite')
									}
								/>
								<Action
									title="Volume Up"
									icon={Icon.SpeakerHigh}
									onAction={() =>
										run({category: 'VOLUME_UP'}, 'Volume increased')
									}
								/>
								<Action
									title="Volume Down"
									icon={Icon.SpeakerLow}
									onAction={() =>
										run({category: 'VOLUME_DOWN'}, 'Volume decreased')
									}
								/>
								<Action
									title="Toggle Shuffle"
									icon={Icon.Shuffle}
									onAction={() =>
										run({category: 'TOGGLE_SHUFFLE'}, 'Shuffle toggled')
									}
								/>
								<Action
									title="Cycle Repeat"
									icon={Icon.Repeat}
									onAction={() =>
										run({category: 'TOGGLE_REPEAT'}, 'Repeat mode changed')
									}
								/>
							</ActionPanel.Section>
							<ActionPanel.Section>
								<Action
									title="Refresh"
									icon={Icon.ArrowClockwise}
									onAction={refresh}
								/>
							</ActionPanel.Section>
						</ActionPanel>
					}
				/>
			)}
		</List>
	);
}
