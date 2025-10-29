param(
  [string]$OutDir = "keys/devnet",
  [int]$AirdropSol = 2
)

$ErrorActionPreference = "Stop"

Write-Host "==> Creating DevNet accounts (admin + 3 users)" -ForegroundColor Cyan

# Ensure Solana CLI is on PATH (portable location fallback)
$solanaBin = "$env:USERPROFILE\solana-cli\solana-release\bin"
if (Test-Path $solanaBin) {
  $env:PATH = "$solanaBin;$env:PATH"
}

# Ensure output directory
$fullOut = Join-Path (Get-Location) $OutDir
New-Item -ItemType Directory -Force -Path $fullOut | Out-Null

function New-Keypair {
  param(
    [string]$name
  )
  $file = Join-Path $fullOut "$name.json"
  Write-Host "- Generating $name keypair" -ForegroundColor Yellow
  # Create new keypair file
  solana-keygen new --no-bip39-passphrase --force -s -o $file | Out-Null
  # Read pubkey
  $pubkey = (solana-keygen pubkey $file).Trim()
  return @{ Name = $name; File = $file; Pubkey = $pubkey }
}

$accounts = @()
$accounts += New-Keypair -name "admin"
$accounts += New-Keypair -name "user1"
$accounts += New-Keypair -name "user2"
$accounts += New-Keypair -name "user3"

# Fund and get balances
function Airdrop-And-GetBalance {
  param(
    [string]$address
  )
  Write-Host "  Airdropping $AirdropSol SOL to $address (devnet)" -ForegroundColor Green
  solana airdrop $AirdropSol $address --url https://api.devnet.solana.com | Out-Null
  Start-Sleep -Seconds 2
  $bal = (solana balance $address --url https://api.devnet.solana.com).Split(' ')[0]
  return [decimal]$bal
}

$summary = @{
  network = "devnet"
  airdropSOL = $AirdropSol
  accounts = @()
}

foreach ($acc in $accounts) {
  $bal = Airdrop-And-GetBalance -address $acc.Pubkey
  $summary.accounts += @{
    name = $acc.Name
    address = $acc.Pubkey
    keyfile = $acc.File
    balanceSOL = $bal
  }
}

# Write summary
$summaryPath = Join-Path $fullOut "summary.json"
$summary | ConvertTo-Json -Depth 4 | Out-File -Encoding utf8 $summaryPath

Write-Host "\n✅ Done. Summary: $summaryPath" -ForegroundColor Cyan
$summaryPath
