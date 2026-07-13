import {getPlayerState} from './client';
import {runAction} from './run-action';

export default async function TogglePlayback(): Promise<void> {
	try {
		const state = await getPlayerState();
		const isPlaying = state.isPlaying === true;
		await runAction(
			{category: isPlaying ? 'PAUSE' : 'RESUME'},
			isPlaying ? '⏸ Playback paused' : '▶ Playback resumed',
		);
	} catch (error) {
		const {showHUD} = await import('@raycast/api');
		await showHUD(
			`❌ ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
