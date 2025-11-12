# PowerShell script to remove secrets from Git history
# WARNING: This rewrites Git history - use with caution!

Write-Host "⚠️  WARNING: This script will rewrite Git history!" -ForegroundColor Yellow
Write-Host "   All team members will need to re-clone the repository after this." -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Are you sure you want to continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "Aborted." -ForegroundColor Red
    exit 1
}

# Secrets to remove
$secrets = @(
    "whsec_0B4ia2Igw7ZAguL7IfEXv96ccElJaWdr",
    "we_1SSTUl0atLU7AWGTUYVLI2id"
)

Write-Host ""
Write-Host "🔍 Checking for secrets in Git history..." -ForegroundColor Cyan

# Check if secrets exist in history
foreach ($secret in $secrets) {
    $found = git log --all --full-history -S $secret --oneline 2>$null
    if ($found) {
        Write-Host "   ❌ Found: $secret" -ForegroundColor Red
    } else {
        Write-Host "   ✅ Not found: $secret" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "🧹 Removing secrets from Git history..." -ForegroundColor Cyan

# Create replacements file
$replacements = @"
whsec_0B4ia2Igw7ZAguL7IfEXv96ccElJaWdr==>whsec_<REDACTED>
we_1SSTUl0atLU7AWGTUYVLI2id==>we_<REDACTED>
"@

$replacements | Out-File -FilePath "$env:TEMP\secrets-replacements.txt" -Encoding utf8

# Check if git-filter-repo is available
$hasFilterRepo = Get-Command git-filter-repo -ErrorAction SilentlyContinue
$hasBFG = Get-Command bfg -ErrorAction SilentlyContinue

if ($hasFilterRepo) {
    Write-Host "   Using git-filter-repo..." -ForegroundColor Green
    git filter-repo --replace-text "$env:TEMP\secrets-replacements.txt" --force
} elseif ($hasBFG) {
    Write-Host "   Using BFG Repo-Cleaner..." -ForegroundColor Green
    bfg --replace-text "$env:TEMP\secrets-replacements.txt"
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
} else {
    Write-Host "   ❌ Neither git-filter-repo nor BFG is installed." -ForegroundColor Red
    Write-Host "   Install one of them:" -ForegroundColor Yellow
    Write-Host "     - git-filter-repo: pip install git-filter-repo" -ForegroundColor Yellow
    Write-Host "     - BFG: https://rtyley.github.io/bfg-repo-cleaner/" -ForegroundColor Yellow
    exit 1
}

# Clean up
Remove-Item "$env:TEMP\secrets-replacements.txt" -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "✅ Secrets removed from Git history!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Verify the changes: git log --all" -ForegroundColor Yellow
Write-Host "   2. Force push to GitHub: git push origin --force --all" -ForegroundColor Yellow
Write-Host "   3. Notify team members to re-clone" -ForegroundColor Yellow
Write-Host "   4. Rotate the exposed secrets in Stripe/Netlify" -ForegroundColor Yellow
Write-Host ""

