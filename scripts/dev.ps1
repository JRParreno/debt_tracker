# Debt Tracker - run backend + frontend with LAN access (phone/tablet on same Wi-Fi)
# Usage: .\scripts\dev.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

Set-Location $Root
$env:DEV_LAN = "1"
$env:LAN_IP = "192.168.0.166"
npm run dev
