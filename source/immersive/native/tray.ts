import {spawn} from 'node:child_process';
import process from 'node:process';

export interface TrayIcon {
	id: string;
	icon: string;
	tooltip: string;
}

let currentTrayIcon: TrayIcon | null = null;
let trayProcess: ReturnType<typeof spawn> | null = null;

export function createTrayIcon(icon: TrayIcon): boolean {
	if (process.platform !== 'win32') {
		return false;
	}

	currentTrayIcon = icon;

	const escapedTooltip = icon.tooltip.replace(/"/g, '`"');
	const escapedId = icon.id.replace(/"/g, '`"');

	const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
$notifyIcon.Visible = $true
$notifyIcon.Text = "${escapedTooltip}"

$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$showItem = New-Object System.Windows.Forms.ToolStripMenuItem("Show")
$showItem.Add_Click({
    $hwnd = (Get-Process -Id ${process.pid}).MainWindowHandle
    if ($hwnd -ne [IntPtr]::Zero) {
        [void] [System.Windows.Forms.Application]::ShowForm($hwnd)
    }
})
$contextMenu.Items.Add($showItem)

$sepItem = New-Object System.Windows.Forms.ToolStripSeparator
$contextMenu.Items.Add($sepItem)

$exitItem = New-Object System.Windows.Forms.ToolStripMenuItem("Exit")
$exitItem.Add_Click({
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    Stop-Process -Id $PID -Force
})
$contextMenu.Items.Add($exitItem)

$notifyIcon.ContextMenuStrip = $contextMenu

$script:notifyIcon = $notifyIcon
Write-Output "TRAY_CREATED:${escapedId}"
`;

	try {
		trayProcess = spawn('powershell', ['-Command', script], {
			windowsHide: true,
			detached: false,
		});

		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		trayProcess.stdout?.on('data', (_data: Buffer) => {
			// Output collection not needed in stub
		});

		trayProcess.on('close', code => {
			if (code !== 0) {
				currentTrayIcon = null;
			}
		});

		return true;
	} catch {
		return false;
	}
}

export function updateTrayIcon(tooltip: string): boolean {
	if (!currentTrayIcon) {
		return false;
	}

	currentTrayIcon.tooltip = tooltip;

	const escapedTooltip = tooltip.replace(/"/g, '`"');

	const script = `
if ($script:notifyIcon) {
    $script:notifyIcon.Text = "${escapedTooltip}"
    Write-Output "TRAY_UPDATED"
}
`;

	try {
		spawn('powershell', ['-Command', script], {windowsHide: true});
		return true;
	} catch {
		return false;
	}
}

export function removeTrayIcon(): void {
	if (!currentTrayIcon) {
		return;
	}

	currentTrayIcon = null;

	const script = `
if ($script:notifyIcon) {
    $script:notifyIcon.Visible = $false
    $script:notifyIcon.Dispose()
    Write-Output "TRAY_REMOVED"
}
`;

	try {
		spawn('powershell', ['-Command', script], {windowsHide: true});
	} catch {
		// Ignore errors
	}

	if (trayProcess && !trayProcess.killed) {
		trayProcess.kill();
		trayProcess = null;
	}
}

export function showBalloonTip(
	title: string,
	message: string,
	iconType: 'info' | 'warning' | 'error' = 'info',
): boolean {
	const escapedTitle = title.replace(/"/g, '`"');
	const escapedMessage = message.replace(/"/g, '`"');

	const script = `
if ($script:notifyIcon) {
    $iconEnum = switch ("${iconType}") {
        "info" { [System.Windows.Forms.ToolTipIcon]::Info }
        "warning" { [System.Windows.Forms.ToolTipIcon]::Warning }
        "error" { [System.Windows.Forms.ToolTipIcon]::Error }
    }
    $script:notifyIcon.ShowBalloonTip(3000, "${escapedTitle}", "${escapedMessage}", $iconEnum)
    Write-Output "BALLOON_SHOWN"
}
`;

	try {
		spawn('powershell', ['-Command', script], {windowsHide: true});
		return true;
	} catch {
		return false;
	}
}

export function minimizeToTray(): boolean {
	const script = `
if ($script:notifyIcon) {
    $parent = (Get-Process -Id ${process.pid}).MainWindowHandle
    if ($parent -ne [IntPtr]::Zero) {
        [void] [System.Windows.Forms.Application]::ShowInTaskbar($parent, $false)
        Write-Output "MINIMIZED_TO_TRAY"
    }
}
`;

	try {
		spawn('powershell', ['-Command', script], {windowsHide: true});
		return true;
	} catch {
		return false;
	}
}

export function restoreFromTray(): boolean {
	const script = `
if ($script:notifyIcon) {
    $parent = (Get-Process -Id ${process.pid}).MainWindowHandle
    if ($parent -ne [IntPtr]::Zero) {
        [void] [System.Windows.Forms.Application]::ShowInTaskbar($parent, $true)
        Write-Output "RESTORED_FROM_TRAY"
    }
}
`;

	try {
		spawn('powershell', ['-Command', script], {windowsHide: true});
		return true;
	} catch {
		return false;
	}
}
