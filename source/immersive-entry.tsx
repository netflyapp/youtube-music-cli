import process from 'node:process';
import {launchImmersiveMode} from './immersive/index.ts';

const discoMode = process.env.DISCO_MODE === 'true';

const trackInfo = process.env.TRACK_INFO
	? JSON.parse(process.env.TRACK_INFO)
	: {
			title: 'No Track',
			artist: 'Press play to start',
			album: undefined,
		};

launchImmersiveMode({
	width: process.stdout.columns || 120,
	height: process.stdout.rows || 40,
	targetFps: 30,
	showAlbumArt: false,
	discoMode,
	enableTray: true,
	enableNotifications: true,
	trackInfo,
});
