param(
  [string]$OutDir = "keys/localnet",
  [int]$AirdropSol = 100
)

$ErrorActionPreference = "Stop"

Write-Host "==> Creating LocalNet accounts (admin + 3 users)" -ForegroundColor Cyan

# Ensure Solana CLI is on PATH (portable location fallback)
$solanaBin = "$env:USERPROFILE\solana-cli\solana-release\bin"
if (Test-Path $solanaBin) {
  $env:PATH = "$solanaBin;$env:PATH"
}

# Ensure output directory
$fullOut = Join-Path (Get-Location) $OutDir
New-Item -ItemType Directory -Force -Path $fullOut | Out-Null

# Base URL for localnet
$LOCAL_URL = "http://localhost:8899"

function New-Keypair {
  param([string]$name)
  $file = Join-Path $fullOut "$name.json"
  Write-Host "- Generating $name keypair" -ForegroundColor Yellow
  solana-keygen new --no-bip39-passphrase --force -s -o $file | Out-Null
  $pubkey = (solana-keygen pubkey $file).Trim()
  return @{ Name = $name; File = $file; Pubkey = $pubkey }
}

$accounts = @()
$accounts += New-Keypair -name "admin"
$accounts += New-Keypair -name "alice"
$accounts += New-Keypair -name "bob"
$accounts += New-Keypair -name "charlie"

function Airdrop-And-GetBalance {
  param([string]$address)
  Write-Host "  Airdropping $AirdropSol SOL to $address (localnet)" -ForegroundColor Green
  solana airdrop $AirdropSol $address --url $LOCAL_URL | Out-Null
  Start-Sleep -Seconds 1
  $bal = (solana balance $address --url $LOCAL_URL).Split(' ')[0]
  return [decimal]$bal
}

$summary = @{ network = "localnet"; airdropSOL = $AirdropSol; accounts = @() }

foreach ($acc in $accounts) {
  $bal = Airdrop-And-GetBalance -address $acc.Pubkey
  $summary.accounts += @{ name = $acc.Name; address = $acc.Pubkey; keyfile = $acc.File; balanceSOL = $bal }
}

$summaryPath = Join-Path $fullOut "summary.json"
$summary | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $summaryPath

Write-Host "\n✅ Done. Summary: $summaryPath" -ForegroundColor Cyan
$summaryPath
