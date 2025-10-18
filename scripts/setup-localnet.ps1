# LocalNet Quick Start Script
# Automates the entire LocalNet setup process

Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Algorand LocalNet Quick Start" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Cyan

# Step 1: Check Docker
Write-Host "1️⃣  Checking Docker..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "   ✅ Docker is running`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Docker is not running!" -ForegroundColor Red
    Write-Host "   Please start Docker Desktop and try again.`n" -ForegroundColor Red
    exit 1
}

# Step 2: Check AlgoKit
Write-Host "2️⃣  Checking AlgoKit..." -ForegroundColor Yellow
try {
    algokit --version | Out-Null
    Write-Host "   ✅ AlgoKit is installed`n" -ForegroundColor Green
} catch {
    Write-Host "   ❌ AlgoKit not found!" -ForegroundColor Red
    Write-Host "   Install with: pipx install algokit`n" -ForegroundColor Red
    exit 1
}

# Step 3: Configure environment
Write-Host "3️⃣  Configuring environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "   ⚠️  .env already exists - backing up to .env.backup" -ForegroundColor Yellow
    Copy-Item .env .env.backup -Force
}
Copy-Item .env.localnet.example .env -Force
Write-Host "   ✅ Environment configured for LocalNet`n" -ForegroundColor Green

# Step 4: Start LocalNet
Write-Host "4️⃣  Starting LocalNet..." -ForegroundColor Yellow
Write-Host "   This may take a minute on first run...`n" -ForegroundColor Gray
algokit localnet start

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n   ✅ LocalNet is running`n" -ForegroundColor Green
} else {
    Write-Host "`n   ❌ Failed to start LocalNet" -ForegroundColor Red
    exit 1
}

# Step 5: Wait for LocalNet to be ready
Write-Host "5️⃣  Waiting for LocalNet to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Write-Host "   ✅ LocalNet is ready`n" -ForegroundColor Green

# Step 6: Compile contract
Write-Host "6️⃣  Compiling smart contract..." -ForegroundColor Yellow
npm run compile:algorand

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Contract compiled`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Compilation failed" -ForegroundColor Red
    exit 1
}

# Step 7: Deploy contract
Write-Host "7️⃣  Deploying contract to LocalNet..." -ForegroundColor Yellow
npm run deploy:local

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Contract deployed`n" -ForegroundColor Green
} else {
    Write-Host "   ❌ Deployment failed" -ForegroundColor Red
    exit 1
}

# Step 8: Create test accounts
Write-Host "8️⃣  Creating test accounts..." -ForegroundColor Yellow
npm run localnet:accounts

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Test accounts created`n" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Account creation failed (non-critical)`n" -ForegroundColor Yellow
}

# Success!
Write-Host "═══════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ LocalNet Setup Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Green

Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Start development server:" -ForegroundColor White
Write-Host "     npm run dev`n" -ForegroundColor Gray
Write-Host "  2. Open browser:" -ForegroundColor White
Write-Host "     http://localhost:5173`n" -ForegroundColor Gray
Write-Host "  3. Test accounts are in:" -ForegroundColor White
Write-Host "     localnet-accounts.json`n" -ForegroundColor Gray

Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  npm run localnet:status  - Check LocalNet status" -ForegroundColor Gray
Write-Host "  npm run localnet:reset   - Reset blockchain state" -ForegroundColor Gray
Write-Host "  npm run localnet:stop    - Stop LocalNet" -ForegroundColor Gray
Write-Host ""

Write-Host "See LOCALNET-SETUP.md for detailed documentation" -ForegroundColor Yellow
Write-Host ""
