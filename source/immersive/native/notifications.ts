import {spawn} from 'node:child_process';

export interface ToastNotification {
	title: string;
	body: string;
	icon?: string;
}

export function showToast(notification: ToastNotification): void {
	const {title, body} = notification;

	const escapedTitle = title.replace(/"/g, '`"').replace(/'/g, "''");
	const escapedBody = body.replace(/"/g, '`"').replace(/'/g, "''");

	const ps = `
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null

$template = @"
<toast duration="short">
  <visual>
    <binding template="ToastGeneric">
      <text>${escapedTitle}</text>
      <text>${escapedBody}</text>
    </binding>
  </visual>
</toast>
"@

$xml = New-Object Windows.Data.Xml.Dom.XmlDocument
$xml.LoadXml($template)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("youtube-music-cli").Show($toast)
`;

	try {
		spawn('powershell', ['-Command', ps], {windowsHide: true});
	} catch {
		// Silently fail - notifications are non-critical
	}
}

export function showTrackChangeToast(trackTitle: string, artist: string): void {
	showToast({
		title: trackTitle,
		body: artist,
	});
}

export function clearToastNotifications(): void {
	const ps = `
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("youtube-music-cli").Clear();
`;

	try {
		spawn('powershell', ['-Command', ps], {windowsHide: true});
	} catch {
		// Ignore errors when clearing
	}
}
