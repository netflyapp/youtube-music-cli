// Radio station type definitions
export interface Station {
	id: string;
	name: string;
	streamUrl: string;
	country: string;
	language: string;
	genre: string;
	tags: string[];
	homepage?: string;
	favicon?: string;
	codec?: string;
	bitrate?: number;
}
