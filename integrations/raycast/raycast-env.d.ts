/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
	/** Server Host - YouTube Music CLI server hostname */
	host: string;
	/** Server Port - YouTube Music CLI server port */
	port: string;
};

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences;

declare namespace Preferences {
	/** Preferences accessible in the `next-track` command */
	export type NextTrack = ExtensionPreferences & {};
	/** Preferences accessible in the `previous-track` command */
	export type PreviousTrack = ExtensionPreferences & {};
	/** Preferences accessible in the `toggle-playback` command */
	export type TogglePlayback = ExtensionPreferences & {};
	/** Preferences accessible in the `favorites` command */
	export type Favorites = ExtensionPreferences & {};
	/** Preferences accessible in the `add-to-favorites` command */
	export type AddToFavorites = ExtensionPreferences & {};
	/** Preferences accessible in the `controller` command */
	export type Controller = ExtensionPreferences & {};
	/** Preferences accessible in the `search` command */
	export type Search = ExtensionPreferences & {};
}

declare namespace Arguments {
	/** Arguments passed to the `next-track` command */
	export type NextTrack = {};
	/** Arguments passed to the `previous-track` command */
	export type PreviousTrack = {};
	/** Arguments passed to the `toggle-playback` command */
	export type TogglePlayback = {};
	/** Arguments passed to the `favorites` command */
	export type Favorites = {};
	/** Arguments passed to the `add-to-favorites` command */
	export type AddToFavorites = {};
	/** Arguments passed to the `controller` command */
	export type Controller = {};
	/** Arguments passed to the `search` command */
	export type Search = {};
}
