import {existsSync} from 'node:fs';
import {spawn, type ChildProcess} from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import {fileURLToPath} from 'node:url';

export interface TrayIcon {
	id: string;
	icon: string;
	tooltip: string;
}

export type TrayAction = 'settings' | 'exit';

let currentTrayIcon: TrayIcon | null = null;
let trayProcess: ChildProcess | null = null;
let trayActionHandler: ((action: TrayAction) => void) | null = null;

const TRAY_DAEMON_SCRIPT = String.raw`
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
$notifyIcon.Text = "YouTube Music CLI"
$notifyIcon.Visible = $true
$menu = New-Object System.Windows.Forms.ContextMenuStrip
$settingsItem = $menu.Items.Add("Settings")
$exitItem = $menu.Items.Add("Exit")
$notifyIcon.ContextMenuStrip = $menu
$settingsItem.Add_Click({
  [Console]::Out.WriteLine("ACTION:settings")
  [Console]::Out.Flush()
})
$exitItem.Add_Click({
  [Console]::Out.WriteLine("ACTION:exit")
  [Console]::Out.Flush()
})
$stdinThread = New-Object System.Threading.Thread([System.Threading.ThreadStart]{
  try {
    while ($true) {
      $line = [Console]::In.ReadLine()
      if ($null -eq $line) { break }
      if ($line -eq "EXIT") {
        $notifyIcon.Visible = $false
        $notifyIcon.Dispose()
        [System.Windows.Forms.Application]::Exit()
        break
      }
      if ($line.StartsWith("TOOLTIP:")) {
        $notifyIcon.Text = $line.Substring(8)
      }
      if ($line.StartsWith("ICON:")) {
        $iconPath = $line.Substring(5)
        if (Test-Path -LiteralPath $iconPath) {
          $notifyIcon.Icon = New-Object System.Drawing.Icon($iconPath)
        }
      }
      if ($line.StartsWith("BALLOON:")) {
        $parts = $line.Substring(8).Split("|", 2)
        if ($parts.Length -eq 2) {
          $notifyIcon.ShowBalloonTip(3000, $parts[0], $parts[1], [System.Windows.Forms.ToolTipIcon]::Info)
        }
      }
    }
  } catch {}
})
$stdinThread.IsBackground = $true
$stdinThread.Start()
[System.Windows.Forms.Application]::Run()
`;

export function parseTrayActionLine(line: string): TrayAction | null {
	const trimmed = line.trim();
	if (trimmed === 'ACTION:settings') {
		return 'settings';
	}
	if (trimmed === 'ACTION:exit') {
		return 'exit';
	}
	return null;
}

export function resolveTrayIconPath(): string | null {
	const moduleDir = path.dirname(fileURLToPath(import.meta.url));
	const candidates = [
		path.join(process.cwd(), 'assets', 'icon.ico'),
		path.join(path.dirname(process.execPath), 'tray-icon.ico'),
		path.join(path.dirname(process.execPath), 'assets', 'icon.ico'),
		path.join(moduleDir, '..', '..', '..', 'assets', 'icon.ico'),
	];

	for (const candidate of candidates) {
		const normalized = path.normalize(candidate);
		if (existsSync(normalized)) {
			return normalized;
		}
	}

	return null;
}

export function setTrayActionHandler(
	handler: ((action: TrayAction) => void) | null,
): void {
	trayActionHandler = handler;
}

function handleTrayStdout(chunk: Buffer | string): void {
	const lines = chunk.toString().split(/\r?\n/);
	for (const line of lines) {
		const action = parseTrayActionLine(line);
		if (action && trayActionHandler) {
			trayActionHandler(action);
		}
	}
}

function ensureTrayDaemon(): boolean {
	if (process.platform !== 'win32') {
		return false;
	}

	if (trayProcess && !trayProcess.killed) {
		return true;
	}

	try {
		const spawned = spawn(
			'powershell',
			['-NoProfile', '-Sta', '-Command', TRAY_DAEMON_SCRIPT],
			{
				windowsHide: true,
				stdio: ['pipe', 'pipe', 'ignore'],
			},
		);

		trayProcess = spawned;

		spawned.stdout?.on('data', handleTrayStdout);

		spawned.on('close', () => {
			trayProcess = null;
			currentTrayIcon = null;
		});

		const iconPath = resolveTrayIconPath();
		if (iconPath) {
			sendTrayCommand(`ICON:${iconPath}`);
		}

		return true;
	} catch {
		return false;
	}
}

function sendTrayCommand(command: string): void {
	if (!trayProcess || trayProcess.killed || !trayProcess.stdin?.writable) {
		return;
	}

	trayProcess.stdin.write(`${command}\n`);
}

export function createTrayIcon(icon: TrayIcon): boolean {
	if (process.platform !== 'win32') {
		return false;
	}

	currentTrayIcon = icon;
	if (!ensureTrayDaemon()) {
		return false;
	}

	sendTrayCommand(`TOOLTIP:${icon.tooltip}`);
	return true;
}

export function updateTrayIcon(tooltip: string): boolean {
	if (!currentTrayIcon) {
		currentTrayIcon = {
			id: 'youtube-music-cli',
			icon: '',
			tooltip,
		};
	}

	currentTrayIcon.tooltip = tooltip;

	if (!ensureTrayDaemon()) {
		return false;
	}

	sendTrayCommand(`TOOLTIP:${tooltip}`);
	return true;
}

export function removeTrayIcon(): void {
	if (!currentTrayIcon && !trayProcess) {
		return;
	}

	currentTrayIcon = null;
	sendTrayCommand('EXIT');

	if (trayProcess && !trayProcess.killed) {
		trayProcess.kill();
		trayProcess = null;
	}
}

export function showBalloonTip(title: string, message: string): boolean {
	if (!ensureTrayDaemon()) {
		return false;
	}

	sendTrayCommand(`BALLOON:${title}|${message}`);
	return true;
}

export function minimizeToTray(): boolean {
	return false;
}

export function restoreFromTray(): boolean {
	return false;
}
