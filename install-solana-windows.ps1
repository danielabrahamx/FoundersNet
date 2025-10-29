# Install Solana CLI on Windows
# Run this script in PowerShell (no admin needed)

Write-Host "🚀 Installing Solana CLI..." -ForegroundColor Green

# Download installer
$installerUrl = "https://github.com/solana-labs/solana/releases/download/v1.18.18/solana-install-init-x86_64-pc-windows-msvc.exe"
$installerPath = "$env:TEMP\solana-install-init.exe"

Write-Host "📥 Downloading Solana installer..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath

Write-Host "⚙️  Running installer..." -ForegroundColor Cyan
Start-Process -FilePath $installerPath -ArgumentList "v1.18.18" -Wait -NoNewWindow

Write-Host "✅ Solana CLI installed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "1. Close and reopen PowerShell/Terminal"
Write-Host "2. Run: solana --version"
Write-Host "3. Run: solana config set --url devnet"
Write-Host "4. Run: solana-keygen new (or recover existing)"
Write-Host "5. Run: npm run deploy:solana:devnet"
Write-Host ""
Write-Host "💡 Add to PATH: C:\Users\$env:USERNAME\.local\share\solana\install\active_release\bin" -ForegroundColor Cyan
