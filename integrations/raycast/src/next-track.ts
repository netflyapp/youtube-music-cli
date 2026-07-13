import {runAction} from './run-action';

export default async function NextTrack(): Promise<void> {
	await runAction({category: 'NEXT'}, '⏭ Skipped to next track');
}
