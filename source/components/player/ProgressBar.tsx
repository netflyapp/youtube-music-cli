// Progress bar component
import {Box, Text} from 'ink';
import {useTheme} from '../../hooks/useTheme.ts';
import {usePlayer} from '../../hooks/usePlayer.ts';
import {formatTime} from '../../utils/format.ts';

function fillSegment(percentage: number, lo: number, hi: number): string {
	if (percentage < lo) return '█';
	if (percentage > hi) return '░';
	return lo < 5 ? '▏' : '▕';
}

function renderBarWithMarkers(
	percentage: number,
	barWidth: number,
	markers: ReadonlyArray<number>,
): string {
	const segments = [];
	for (let slot = 0; slot < 20; slot++) {
		const lo = slot * 5;
		const hi = lo + 5;
		const isMarker =
			markers.some(
				marker => marker >= lo && marker < hi,
			) && percentage < hi;
		segments.push(
			isMarker ? '|' : fillSegment(percentage, lo, hi),
		);
	}
	return segments.slice(0, barWidth).join('');
}

function renderRemainingBar(
	percentage: number,
	barWidth: number,
	markers: ReadonlyArray<number>,
): string {
	if (barWidth >= 20) return '';
	const segments = [];
	for (let slot = barWidth; slot < 20; slot++) {
		const lo = slot * 5;
		const hi = lo + 5;
		const isMarker =
			markers.some(marker => marker > lo && marker <= hi) &&
			percentage < lo;
		segments.push(isMarker ? '|' : '░');
	}
	return segments.join('');
}

function markerPoints(
	duration: number,
	abLoop: {a: number | null; b: number | null},
): number[] {
	const points: number[] = [];
	if (duration <= 0) return points;
	if (abLoop.a !== null && abLoop.a >= 0 && abLoop.a <= duration) {
		points.push((abLoop.a / duration) * 100);
	}
	if (abLoop.b !== null && abLoop.b >= 0 && abLoop.b <= duration) {
		points.push((abLoop.b / duration) * 100);
	}
	return points;
}

export default function ProgressBar() {
	const {theme} = useTheme();
	const {state: playerState} = usePlayer();

	if (!playerState.currentTrack || !playerState.duration) {
		return null;
	}

	const progress = Math.max(
		0,
		Math.min(playerState.progress, playerState.duration),
	);
	const duration = playerState.duration;
	const percentage =
		duration > 0 ? Math.min(100, Math.floor((progress / duration) * 100)) : 0;
	const barWidth = Math.min(20, Math.floor(percentage / 5));

	const markers = markerPoints(duration, playerState.abLoop);

	return (
		<Box>
			<Text color={theme.colors.text}>{formatTime(progress)}</Text>
			<Text color={theme.colors.dim}>/</Text>
			<Text color={theme.colors.text}>{formatTime(duration)}</Text>
			<Text> </Text>
			<Text color={theme.colors.primary}>
				{renderBarWithMarkers(percentage, barWidth, markers)}
			</Text>
			<Text color={theme.colors.dim}>
				{renderRemainingBar(percentage, barWidth, markers)}
			</Text>
			<Text color={theme.colors.dim}> {percentage}%</Text>
		</Box>
	);
}
