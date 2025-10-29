# Starts the local Solana validator
# Run this PowerShell script in a window with Developer Mode enabled (or as Administrator)

$ErrorActionPreference = "Stop"

$solanaBin = "$env:USERPROFILE\solana-cli\solana-release\bin"
if (Test-Path $solanaBin) { $env:PATH = "$solanaBin;$env:PATH" }

Write-Host "➡️  Setting CLI to localhost" -ForegroundColor Yellow
solana config set --url localhost | Out-Null

Write-Host "🚀 Starting solana-test-validator (ledger: ./.ledger)" -ForegroundColor Cyan

# Create a local ledger directory to avoid permission issues
$ledger = Join-Path (Get-Location) ".ledger"
New-Item -ItemType Directory -Force -Path $ledger | Out-Null

# Start validator
solana-test-validator --ledger $ledger --reset