# TestNet Deployment Setup Script
# Run this to configure and deploy to TestNet

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  Algorand TestNet Deployment Setup" -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.testnet exists
if (!(Test-Path ".env.testnet")) {
    Write-Host "[ERROR] .env.testnet not found!" -ForegroundColor Red
    Write-Host "Creating from template..." -ForegroundColor Yellow
    Copy-Item .env.testnet.template .env.testnet
}

Write-Host "Pera Wallet Setup Checklist:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Before continuing, make sure you have:" -ForegroundColor White
Write-Host "  1. ✅ Pera Wallet installed on mobile" -ForegroundColor Green
Write-Host "  2. ✅ TestNet enabled (Settings > Developer Settings)" -ForegroundColor Green
Write-Host "  3. ✅ At least 5 ALGO in your TestNet account" -ForegroundColor Green
Write-Host ""
Write-Host "Get test ALGO: https://bank.testnet.algorand.network/" -ForegroundColor Cyan
Write-Host ""

# Prompt for wallet address
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 1: Enter Your Wallet Address" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "📍 In Pera Wallet:" -ForegroundColor White
Write-Host "   - Tap your account name" -ForegroundColor Gray
Write-Host "   - Copy the full address (58 characters)" -ForegroundColor Gray
Write-Host ""

$walletAddress = Read-Host "Paste your TestNet wallet address"

if ($walletAddress.Length -ne 58) {
    Write-Host "❌ Invalid address! Must be 58 characters." -ForegroundColor Red
    Write-Host "Your address is $($walletAddress.Length) characters long." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Address validated: $($walletAddress.Substring(0,8))...$($walletAddress.Substring($walletAddress.Length-6))" -ForegroundColor Green
Write-Host ""

# Prompt for mnemonic
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 2: Enter Your Mnemonic (25 words)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  SECURITY WARNING:" -ForegroundColor Red
Write-Host "   - Only use a TestNet account!" -ForegroundColor Red
Write-Host "   - Never share your MainNet mnemonic!" -ForegroundColor Red
Write-Host ""
Write-Host "📍 In Pera Wallet:" -ForegroundColor White
Write-Host "   - Settings > Account > Show Passphrase" -ForegroundColor Gray
Write-Host "   - Copy all 25 words" -ForegroundColor Gray
Write-Host ""

$mnemonic = Read-Host "Paste your 25-word mnemonic"

# Count words
$wordCount = ($mnemonic -split '\s+').Count
if ($wordCount -ne 25) {
    Write-Host "❌ Invalid mnemonic! Must be exactly 25 words." -ForegroundColor Red
    Write-Host "You entered $wordCount words." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Mnemonic validated (25 words)" -ForegroundColor Green
Write-Host ""

# Update .env.testnet
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 3: Updating Configuration" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$envContent = Get-Content .env.testnet -Raw

# Update values
$envContent = $envContent -replace 'VITE_ALGORAND_ADMIN_ADDRESS=.*', "VITE_ALGORAND_ADMIN_ADDRESS=$walletAddress"
$envContent = $envContent -replace 'ALGORAND_MNEMONIC=.*', "ALGORAND_MNEMONIC=$mnemonic"
$envContent = $envContent -replace 'ALGORAND_DEPLOYER_MNEMONIC=.*', "ALGORAND_DEPLOYER_MNEMONIC=$mnemonic"

# Save
$envContent | Set-Content .env.testnet

Write-Host "✅ Configuration saved to .env.testnet" -ForegroundColor Green
Write-Host ""

# Ask if ready to deploy
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 4: Deploy to TestNet" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

$deploy = Read-Host "Ready to deploy? This will cost ~2-3 ALGO. (y/n)"

if ($deploy -eq 'y' -or $deploy -eq 'Y') {
    Write-Host ""
    Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan
    Write-Host ""
    
    # Copy to .env
    Copy-Item .env.testnet .env
    
    # Deploy
    npm run deploy:testnet
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host "  ✅ Deployment Successful!" -ForegroundColor Green
        Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "  1. Copy the App ID from above" -ForegroundColor White
        Write-Host "  2. Update .env.testnet with: VITE_ALGORAND_APP_ID=<app-id>" -ForegroundColor White
        Write-Host "  3. Run: npm run dev" -ForegroundColor White
        Write-Host "  4. Open: http://localhost:5173" -ForegroundColor White
        Write-Host "  5. Connect your Pera Wallet" -ForegroundColor White
        Write-Host ""
    } else {
        Write-Host ""
        Write-Host "❌ Deployment failed. Check the error above." -ForegroundColor Red
        Write-Host ""
    }
} else {
    Write-Host ""
    Write-Host "Deployment cancelled. Configuration saved to .env.testnet" -ForegroundColor Yellow
    Write-Host "When ready, run: npm run deploy:testnet" -ForegroundColor Cyan
    Write-Host ""
}
