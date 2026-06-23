import process from 'node:process';
import {render} from 'ink';
import React from 'react';
import {ImmersivePlayer} from './components/immersive-player.tsx';

export interface ImmersiveOptions {
	width?: number;
	height?: number;
	targetFps?: number;
	showAlbumArt?: boolean;
	discoMode?: boolean;
	enableTray?: boolean;
	enableNotifications?: boolean;
	trackInfo?: {
		title: string;
		artist: string;
		album?: string;
		artwork?: string;
	};
}

export function launchImmersiveMode(options: ImmersiveOptions): void {
	if (process.platform !== 'win32') {
		console.error('Immersive mode is only supported on Windows.');
		process.exit(1);
	}

	const {waitUntilExit} = render(React.createElement(ImmersivePlayer, options));

	waitUntilExit().then(() => {
		process.exit(0);
	});
}

export function isImmersiveSupported(): boolean {
	return process.platform === 'win32';
}

export {ImmersivePlayer} from './components/immersive-player.tsx';
export {useImmersivePlayer} from './components/immersive-player.tsx';

export {AudioCollector} from './visualizer/audio-collector.ts';
export {DiscoEngine} from './visualizer/disco-engine.ts';

export {FrameBuffer} from './renderer/frame-buffer.ts';
export {BrailleCanvas} from './renderer/braille-canvas.ts';
export {RenderLoop} from './renderer/render-loop.ts';
export {ANSI, rgb, hexToRgb} from './renderer/ansi-codes.ts';

export {
	DiscoParticleSystem,
	ParticleSystem,
} from './effects/particle-system.ts';
export {ColorExtractor} from './effects/color-extractor.ts';

export {
	createTrayIcon,
	removeTrayIcon,
	showBalloonTip,
	updateTrayIcon,
} from './native/tray.ts';
export {
	registerHotkey,
	unregisterHotkey,
	unregisterAllHotkeys,
	startHotkeyListener,
	stopHotkeyListener,
} from './native/hotkeys.ts';
export {
	showToast,
	showTrackChangeToast,
	clearToastNotifications,
} from './native/notifications.ts';
export {
	getTerminalInfo,
	setConsoleTitle,
	clearScreen,
	hideCursor,
	showCursor,
	enterAltBuffer,
	exitAltBuffer,
	resetCursor,
} from './native/console.ts';
