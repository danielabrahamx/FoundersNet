param(
  [Parameter(Mandatory=$true)][string[]]$Addresses,
  [int]$AmountSol = 100
)

$ErrorActionPreference = "Stop"
$solanaBin = "$env:USERPROFILE\solana-cli\solana-release\bin"
if (Test-Path $solanaBin) { $env:PATH = "$solanaBin;$env:PATH" }

$LOCAL_URL = "http://localhost:8899"

foreach ($addr in $Addresses) {
  Write-Host "Airdropping $AmountSol SOL to $addr" -ForegroundColor Green
  solana airdrop $AmountSol $addr --url $LOCAL_URL | Out-Null
  $bal = (solana balance $addr --url $LOCAL_URL).Split(' ')[0]
  Write-Host "  New balance: $bal SOL" -ForegroundColor Cyan
}