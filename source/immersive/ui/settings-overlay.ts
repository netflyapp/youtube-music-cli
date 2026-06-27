export interface SettingsRow {
	label: string;
	value: string;
}

export interface SettingsOverlayState {
	active: boolean;
	selectedIndex: number;
	status: string | null;
}

export const SETTINGS_ROW_COUNT = 5;

export function createSettingsOverlayState(): SettingsOverlayState {
	return {
		active: false,
		selectedIndex: 0,
		status: null,
	};
}

export function openSettingsOverlay(state: SettingsOverlayState): void {
	state.active = true;
	state.selectedIndex = 0;
	state.status = null;
}

export function closeSettingsOverlay(state: SettingsOverlayState): void {
	state.active = false;
	state.selectedIndex = 0;
	state.status = null;
}

export type SettingsInputAction = 'none' | 'close' | 'cycle';

export function handleSettingsInput(
	state: SettingsOverlayState,
	key: string,
	rowCount: number,
): SettingsInputAction {
	if (key === 'escape') {
		closeSettingsOverlay(state);
		return 'close';
	}

	if (rowCount === 0) {
		return 'none';
	}

	if (key === 'up') {
		state.selectedIndex = Math.max(0, state.selectedIndex - 1);
		return 'none';
	}

	if (key === 'down') {
		state.selectedIndex = Math.min(rowCount - 1, state.selectedIndex + 1);
		return 'none';
	}

	if (key === 'enter') {
		return 'cycle';
	}

	return 'none';
}
