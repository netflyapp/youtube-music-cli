import {showHUD} from '@raycast/api';
import {sendPlayerAction} from './client';
import type {PlayerAction} from './types';

export async function runAction(
	action: PlayerAction,
	successMessage: string,
): Promise<void> {
	try {
		await sendPlayerAction(action);
		await showHUD(successMessage);
	} catch (error) {
		await showHUD(
			`❌ ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
