import {runAction} from './run-action';

export default async function PreviousTrack(): Promise<void> {
	await runAction({category: 'PREVIOUS'}, '⏮ Returned to previous track');
}
