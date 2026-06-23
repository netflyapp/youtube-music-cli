import {useEffect, useRef, useCallback} from 'react';
import process from 'node:process';
import * as readline from 'node:readline';
import type {FrameBuffer} from '../renderer/frame-buffer.ts';
import type {BrailleCanvas} from '../renderer/braille-canvas.ts';
import {RenderLoop} from '../renderer/render-loop.ts';
import {AudioCollector} from '../visualizer/audio-collector.ts';
import {DiscoEngine} from '../visualizer/disco-engine.ts';
import {DiscoParticleSystem} from '../effects/particle-system.ts';
import {
	getTerminalInfo,
	clearScreen,
	hideCursor,
	showCursor,
	enterAltBuffer,
	exitAltBuffer,
} from '../native/console.ts';
import {createTrayIcon, removeTrayIcon} from '../native/tray.ts';
import type {RGB} from '../renderer/ansi-codes.ts';

export interface ImmersivePlayerProps {
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
	onClose?: () => void;
	onTogglePlay?: () => void;
	onToggleDisco?: () => void;
	onVolumeUp?: () => void;
	onVolumeDown?: () => void;
	onNext?: () => void;
	onPrevious?: () => void;
}

interface PlayerState {
	isPlaying: boolean;
	currentTime: number;
	duration: number;
	volume: number;
	isDiscoMode: boolean;
}

export function ImmersivePlayer({
	width,
	height,
	targetFps = 30,
	showAlbumArt: _showAlbumArt = false,
	discoMode = false,
	enableTray = true,
	enableNotifications: _enableNotifications = false,
	trackInfo,
	onClose: _onClose,
	onTogglePlay,
	onToggleDisco,
	onVolumeUp,
	onVolumeDown,
	onNext,
	onPrevious,
}: ImmersivePlayerProps): null {
	const frameBufferRef = useRef<FrameBuffer | null>(null);
	const canvasRef = useRef<BrailleCanvas | null>(null);
	const renderLoopRef = useRef<RenderLoop | null>(null);
	const audioCollectorRef = useRef<AudioCollector | null>(null);
	const discoEngineRef = useRef<DiscoEngine | null>(null);
	const particleSystemRef = useRef<DiscoParticleSystem | null>(null);
	const stateRef = useRef<PlayerState>({
		isPlaying: true,
		currentTime: 0,
		duration: 0,
		volume: 1,
		isDiscoMode: discoMode,
	});
	const playerCallbacksRef = useRef({
		onTogglePlay,
		onToggleDisco,
		onVolumeUp,
		onVolumeDown,
		onNext,
		onPrevious,
	});

	useEffect(() => {
		playerCallbacksRef.current = {
			onTogglePlay,
			onToggleDisco,
			onVolumeUp,
			onVolumeDown,
			onNext,
			onPrevious,
		};
	}, [
		onTogglePlay,
		onToggleDisco,
		onVolumeUp,
		onVolumeDown,
		onNext,
		onPrevious,
	]);

	const terminalInfo = getTerminalInfo();
	const effectiveWidth = width ?? terminalInfo.width;
	const effectiveHeight = height ?? terminalInfo.height;

	const cleanup = useCallback(() => {
		renderLoopRef.current?.stop();
		renderLoopRef.current = null;
		frameBufferRef.current = null;
		canvasRef.current = null;

		showCursor();
		exitAltBuffer();

		if (enableTray) {
			removeTrayIcon();
		}
	}, [enableTray]);

	useEffect(() => {
		if (process.platform !== 'win32') {
			return;
		}

		enterAltBuffer();
		hideCursor();
		clearScreen();

		async function init() {
			const {FrameBuffer: Fb} = await import('../renderer/frame-buffer.ts');
			const {BrailleCanvas: Bc} = await import('../renderer/braille-canvas.ts');
			const {RenderLoop: Rl} = await import('../renderer/render-loop.ts');
			const {AudioCollector: Ac} =
				await import('../visualizer/audio-collector.ts');
			const {DiscoEngine: De} = await import('../visualizer/disco-engine.ts');
			const {DiscoParticleSystem: Dps} =
				await import('../effects/particle-system.ts');

			const fb = new Fb(effectiveWidth, effectiveHeight);
			const canvas = new Bc(fb);
			const loop = new Rl(fb, {targetFps});
			const audio = new Ac(256);
			const disco = new De({enabled: stateRef.current.isDiscoMode});
			const particles = new Dps({
				spawnRate: 10,
				colors: [
					[255, 100, 100],
					[100, 255, 100],
					[100, 100, 255],
					[255, 255, 100],
					[255, 100, 255],
					[100, 255, 255],
				],
			});

			frameBufferRef.current = fb;
			canvasRef.current = canvas;
			renderLoopRef.current = loop;
			audioCollectorRef.current = audio;
			discoEngineRef.current = disco;
			particleSystemRef.current = particles;

			if (enableTray && trackInfo) {
				createTrayIcon({
					id: 'youtube-music-cli',
					icon: '',
					tooltip: `${trackInfo.title} - ${trackInfo.artist}`,
				});
			}

			loop.start(deltaTime => {
				if (!fb || !canvas || !audio || !disco || !particles) return;

				const {width: tw, height: th} = getTerminalInfo();

				if (tw !== effectiveWidth || th !== effectiveHeight) {
					fb.width = tw;
					fb.height = th;
					fb.cells = Array.from({length: th}, () =>
						Array.from({length: tw}, () => ({
							char: ' ',
							fg: null,
							bg: null,
						})),
					);
				}

				particles.update(deltaTime);

				const time = performance.now();
				const simulatedAudio = audio.generateSimulatedData(time);
				const bands = audio.getFrequencyBands(simulatedAudio);

				disco.update(deltaTime);
				const {background, accent, intensity} = disco.processAudio(bands);

				fb.clear();

				renderBackground(fb, tw, th, background, accent, intensity);
				renderVisualizer(fb, canvas, audio, tw, th, accent, intensity);
				renderTrackInfo(fb, tw, th, trackInfo, stateRef.current);
				renderControls(fb, tw, th, stateRef.current);

				if (stateRef.current.isDiscoMode) {
					for (const particle of particles.getParticles()) {
						const screenX = (particle.x / 100) * tw;
						const screenY = (particle.y / 100) * th;
						canvas.setPixel(
							Math.floor(screenX),
							Math.floor(screenY),
							particle.color,
						);
					}

					if (intensity > 0.7) {
						particles.spawnBurst(
							tw / 2,
							th - 5,
							Math.floor(intensity * 5),
							accent,
						);
					}
				}
			});
		}

		init().catch(console.error);

		return cleanup;
	}, [
		effectiveWidth,
		effectiveHeight,
		targetFps,
		enableTray,
		trackInfo,
		cleanup,
	]);

	useEffect(() => {
		if (process.platform !== 'win32') {
			return;
		}

		const rl = readline.createInterface({
			input: process.stdin,
			escapeCodeTimeout: 100,
		});

		rl.on('keypress', (_string, key) => {
			if (!key) return;

			if (key.ctrl && key.name === 'c') {
				cleanup();
				process.exit(0);
				return;
			}

			const callbacks = playerCallbacksRef.current;

			switch (key.name?.toLowerCase()) {
				case ' ':
				case 'space':
					stateRef.current.isPlaying = !stateRef.current.isPlaying;
					callbacks.onTogglePlay?.();
					break;
				case 'd':
					stateRef.current.isDiscoMode = !stateRef.current.isDiscoMode;
					callbacks.onToggleDisco?.();
					break;
				case 'up':
				case 'uparrow':
					stateRef.current.volume = Math.min(1, stateRef.current.volume + 0.1);
					callbacks.onVolumeUp?.();
					break;
				case 'down':
				case 'downarrow':
					stateRef.current.volume = Math.max(0, stateRef.current.volume - 0.1);
					callbacks.onVolumeDown?.();
					break;
				case 'right':
				case 'rightarrow':
					callbacks.onNext?.();
					break;
				case 'left':
				case 'leftarrow':
					callbacks.onPrevious?.();
					break;
				case 'q':
				case 'escape':
					cleanup();
					process.exit(0);
					break;
			}
		});

		return () => {
			rl.close();
		};
	}, [cleanup]);

	return null;
}

function renderBackground(
	fb: FrameBuffer,
	_width: number,
	_height: number,
	_background: RGB,
	_accent: RGB,
	_intensity: number,
): void {
	fb.verticalGradient(0, 0, _width, _height, _background, [
		Math.round((_background[0] ?? 0) * 0.5),
		Math.round((_background[1] ?? 0) * 0.5),
		Math.round((_background[2] ?? 0) * 0.5),
	]);

	const barCount = 5;
	const barWidth = Math.floor(_width / barCount) - 2;

	for (let i = 0; i < barCount; i++) {
		const x = i * (barWidth + 2) + 1;
		const barHeight = Math.floor(2 + Math.random() * 4 * _intensity);

		fb.drawRect(x, 0, barWidth, barHeight + 2, _accent, null, 'round');
	}
}

function renderVisualizer(
	_fb: FrameBuffer,
	_canvas: BrailleCanvas,
	_audio: AudioCollector,
	_width: number,
	_height: number,
	_accent: RGB,
	_intensity: number,
): void {
	const vizHeight = Math.floor(_height * 0.4);
	const vizY = Math.floor(_height * 0.3);

	const time = performance.now();
	const data = _audio.generateSimulatedData(time);
	const bands = _audio.getFrequencyBands(data);

	const barCount = 20;
	const barWidth = Math.floor(_width / barCount) - 1;

	for (let i = 0; i < barCount; i++) {
		const freqIndex = Math.floor((i / barCount) * data.length);
		const value = data[freqIndex] ?? 0;
		const barHeight = Math.floor(value * vizHeight);

		const hue = (i / barCount) * 60 + bands.bass * 30;
		const color: RGB = hslToRgb(hue / 360, 0.8, 0.5 + _intensity * 0.2);

		_canvas.drawRect(
			i * (barWidth + 1) + Math.floor((_width - barCount * (barWidth + 1)) / 2),
			vizY + vizHeight - barHeight,
			barWidth,
			barHeight,
			color,
			true,
		);
	}
}

function renderTrackInfo(
	_fb: FrameBuffer,
	_width: number,
	_height: number,
	_trackInfo?: {
		title: string;
		artist: string;
		album?: string;
		artwork?: string;
	},
	_state?: PlayerState,
): void {
	if (!_trackInfo) return;

	const infoY = Math.floor(_height * 0.7);

	const truncatedTitle = truncateText(_trackInfo.title, _width - 4);
	const truncatedArtist = truncateText(_trackInfo.artist, _width - 4);

	_fb.setText(
		Math.floor((_width - truncatedTitle.length) / 2),
		infoY,
		truncatedTitle,
		null,
		null,
		{bold: true},
	);
	_fb.setText(
		Math.floor((_width - truncatedArtist.length) / 2),
		infoY + 1,
		truncatedArtist,
		null,
		null,
		{dim: true},
	);

	if (_state) {
		const statusText = _state.isPlaying ? '[ PLAYING ]' : '[ PAUSED ]';
		_fb.setText(
			Math.floor((_width - statusText.length) / 2),
			infoY + 3,
			statusText,
			null,
			null,
			{bold: true},
		);
	}
}

function renderControls(
	_fb: FrameBuffer,
	_width: number,
	_height: number,
	_state?: PlayerState,
): void {
	const controlsY = _height - 3;

	const controls = [
		'[←] Prev',
		'[SPACE] Play/Pause',
		'[D] Disco',
		'[↑↓] Volume',
		'[→] Next',
		'[Q] Quit',
	];

	let x = 2;
	for (const control of controls) {
		_fb.setText(x, controlsY, control, null, null, {dim: true});
		x += control.length + 2;
	}
}

function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text;
	return text.substring(0, maxLength - 3) + '...';
}

function hslToRgb(h: number, s: number, l: number): RGB {
	let r: number;
	let g: number;
	let b: number;

	if (s === 0) {
		r = g = b = l;
	} else {
		const hue2rgb = (p: number, q: number, t: number): number => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1 / 6) return p + (q - p) * 6 * t;
			if (t < 1 / 2) return q;
			if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
			return p;
		};

		const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		const p = 2 * l - q;
		r = hue2rgb(p, q, h + 1 / 3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1 / 3);
	}

	return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function useImmersivePlayer(): {
	togglePlay: () => void;
	toggleDisco: () => void;
	setVolume: (volume: number) => void;
	skipNext: () => void;
	skipPrevious: () => void;
	close: () => void;
} {
	return {
		togglePlay: () => {
			const state = (
				globalThis as typeof globalThis & {__immersivePlayerState?: PlayerState}
			).__immersivePlayerState;
			if (state) {
				state.isPlaying = !state.isPlaying;
			}
		},
		toggleDisco: () => {
			const state = (
				globalThis as typeof globalThis & {__immersivePlayerState?: PlayerState}
			).__immersivePlayerState;
			if (state) {
				state.isDiscoMode = !state.isDiscoMode;
			}
		},
		setVolume: (volume: number) => {
			const state = (
				globalThis as typeof globalThis & {__immersivePlayerState?: PlayerState}
			).__immersivePlayerState;
			if (state) {
				state.volume = Math.max(0, Math.min(1, volume));
			}
		},
		skipNext: () => {
			// Implemented via player service
		},
		skipPrevious: () => {
			// Implemented via player service
		},
		close: () => {
			showCursor();
			exitAltBuffer();
			removeTrayIcon();
		},
	};
}
