import {runAction} from './run-action';

export default async function AddToFavorites(): Promise<void> {
	await runAction({category: 'TOGGLE_FAVORITE'}, '❤ Toggled favorite');
}
