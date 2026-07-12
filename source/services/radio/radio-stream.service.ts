// Radio streaming service — fetches stations from radio-browser.info API
// Falls back to offline curated list when API is unavailable
import {logger} from '../logger/logger.service.ts';
import {formatError} from '../../utils/error.ts';
import {OFFLINE_STATIONS} from './stations.ts';
import type {Station} from '../../types/station.types.ts';

const API_BASE = 'https://de1.api.radio-browser.info/json';

class RadioStreamService {
	private cachedStations: Station[] | null = null;
	private apiAvailable: boolean | null = null;

	async checkApiAvailability(): Promise<boolean> {
		if (this.apiAvailable !== null) return this.apiAvailable;

		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 3000);

			const response = await fetch(`${API_BASE}/stats`, {
				signal: controller.signal,
			});
			clearTimeout(timeout);

			this.apiAvailable = response.ok;
			return this.apiAvailable;
		} catch {
			this.apiAvailable = false;
			return false;
		}
	}

	async fetchAllStations(): Promise<Station[]> {
		if (this.cachedStations) return this.cachedStations;

		const available = await this.checkApiAvailability();
		if (!available) {
			logger.info(
				'RadioStreamService',
				'API unavailable, using offline stations',
			);
			this.cachedStations = OFFLINE_STATIONS;
			return this.cachedStations;
		}

		try {
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 8000);

			const response = await fetch(
				`${API_BASE}/stations/search?limit=100&hidebroken=true`,
				{signal: controller.signal},
			);
			clearTimeout(timeout);

			if (!response.ok) {
				throw new Error(`API returned ${response.status}`);
			}

			const data = (await response.json()) as Array<Record<string, unknown>>;
			const stations = this.normalizeApiResponse(data);

			this.cachedStations = [...stations, ...OFFLINE_STATIONS];

			logger.info(
				'RadioStreamService',
				`Fetched ${stations.length} stations from API, ${OFFLINE_STATIONS.length} offline`,
			);

			return this.cachedStations;
		} catch (error) {
			logger.warn(
				'RadioStreamService',
				'Failed to fetch from API, using offline stations',
				{error: formatError(error)},
			);
			this.cachedStations = OFFLINE_STATIONS;
			return this.cachedStations;
		}
	}

	async fetchByCountry(country: string): Promise<Station[]> {
		const available = await this.checkApiAvailability();
		if (!available) {
			return OFFLINE_STATIONS.filter(
				s => s.country.toLowerCase() === country.toLowerCase(),
			);
		}

		try {
			const encoded = encodeURIComponent(country);
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 8000);

			const response = await fetch(
				`${API_BASE}/stations/bycountry/${encoded}?limit=100&hidebroken=true`,
				{signal: controller.signal},
			);
			clearTimeout(timeout);

			if (!response.ok) throw new Error(`API returned ${response.status}`);

			const data = (await response.json()) as Array<Record<string, unknown>>;
			return this.normalizeApiResponse(data);
		} catch (error) {
			logger.warn(
				'RadioStreamService',
				`Failed to fetch stations for country ${country}, using offline`,
				{error: formatError(error)},
			);
			return OFFLINE_STATIONS.filter(
				s => s.country.toLowerCase() === country.toLowerCase(),
			);
		}
	}

	async searchStations(query: string): Promise<Station[]> {
		const available = await this.checkApiAvailability();
		if (!available) {
			const q = query.toLowerCase();
			return OFFLINE_STATIONS.filter(
				s =>
					s.name.toLowerCase().includes(q) ||
					s.tags.some(t => t.includes(q)) ||
					s.genre.toLowerCase().includes(q),
			);
		}

		try {
			const encoded = encodeURIComponent(query);
			const controller = new AbortController();
			const timeout = setTimeout(() => controller.abort(), 8000);

			const response = await fetch(
				`${API_BASE}/stations/byname/${encoded}?limit=100&hidebroken=true`,
				{signal: controller.signal},
			);
			clearTimeout(timeout);

			if (!response.ok) throw new Error(`API returned ${response.status}`);

			const data = (await response.json()) as Array<Record<string, unknown>>;
			const apiStations = this.normalizeApiResponse(data);

			const q = query.toLowerCase();
			const offlineMatches = OFFLINE_STATIONS.filter(
				s =>
					!apiStations.find(a => a.id === s.id) &&
					(s.name.toLowerCase().includes(q) ||
						s.tags.some(t => t.includes(q))),
			);

			return [...apiStations, ...offlineMatches];
		} catch (error) {
			logger.warn(
				'RadioStreamService',
				`Failed to search stations for ${query}, using offline`,
				{error: formatError(error)},
			);
			const q = query.toLowerCase();
			return OFFLINE_STATIONS.filter(
				s =>
					s.name.toLowerCase().includes(q) ||
					s.tags.some(t => t.includes(q)) ||
					s.genre.toLowerCase().includes(q),
			);
		}
	}

	private normalizeApiResponse(
		data: Array<Record<string, unknown>>,
	): Station[] {
		const seen = new Set<string>();
		const stations: Station[] = [];

		for (const item of data) {
			const name = String(item.name ?? '');
			const url = String(item.url_resolved ?? item.url ?? '');
			if (!name || !url) continue;

			const id = String(item.stationuuid ?? `online-${name}`);
			if (seen.has(id)) continue;
			seen.add(id);

			const tagsStr = String(item.tags ?? '');
			const tags = tagsStr
				.split(',')
				.map(t => t.trim().toLowerCase())
				.filter(Boolean);

			stations.push({
				id,
				name,
				streamUrl: url,
				country: String(item.country ?? 'Unknown'),
				language: String(item.language ?? 'unknown'),
				genre: String(item.genre ?? tags[0] ?? 'Unknown'),
				tags,
				homepage: String(item.homepage ?? '') || undefined,
				favicon: String(item.favicon ?? '') || undefined,
				codec: String(item.codec ?? '') || undefined,
				bitrate: Number(item.bitrate) || undefined,
			});
		}

		return stations;
	}

	clearCache(): void {
		this.cachedStations = null;
		this.apiAvailable = null;
	}
}

let instance: RadioStreamService | null = null;

export function getRadioStreamService(): RadioStreamService {
	if (!instance) {
		instance = new RadioStreamService();
	}

	return instance;
}

export function resetRadioStreamService(): void {
	instance = null;
}
