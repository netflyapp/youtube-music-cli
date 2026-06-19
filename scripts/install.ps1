$ErrorActionPreference = 'Stop'

$package = '@involvex/youtube-music-cli'

# Check for bun first (recommended)
if (Get-Command bun -ErrorAction SilentlyContinue) {
	bun install -g $package
	Write-Host 'youtube-music-cli installed via bun. Run: youtube-music-cli'
	exit 0
}

# Fallback to npm
if (Get-Command npm -ErrorAction SilentlyContinue) {
	npm install -g $package
	Write-Host 'youtube-music-cli installed via npm. Run: youtube-music-cli'
	exit 0
}

Write-Host "Error: bun or node.js is required to install $package." -ForegroundColor Red
Write-Host 'Install bun from https://bun.sh or node.js from https://nodejs.org' -ForegroundColor Red
exit 1
