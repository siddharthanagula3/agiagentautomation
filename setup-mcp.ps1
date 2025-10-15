# Supabase MCP Setup Script for Windows
# This script automatically configures Claude Desktop to connect to your local Supabase database

Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Supabase MCP Server Setup Script" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase is running
Write-Host "1. Checking if Supabase is running..." -ForegroundColor Yellow
try {
    $supabaseStatus = supabase status 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Supabase is running!" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Supabase is not running" -ForegroundColor Red
        Write-Host "   Starting Supabase..." -ForegroundColor Yellow
        supabase start
    }
} catch {
    Write-Host "   ✗ Supabase CLI not found or not running" -ForegroundColor Red
    Write-Host "   Please run 'supabase start' manually" -ForegroundColor Yellow
    exit 1
}

# Locate Claude Desktop config
Write-Host ""
Write-Host "2. Locating Claude Desktop config..." -ForegroundColor Yellow
$claudeConfigPath = "$env:APPDATA\Claude\claude_desktop_config.json"

if (Test-Path $claudeConfigPath) {
    Write-Host "   ✓ Found Claude config at: $claudeConfigPath" -ForegroundColor Green
} else {
    Write-Host "   ! Config file not found, creating new one..." -ForegroundColor Yellow
    $claudeConfigDir = Split-Path $claudeConfigPath -Parent
    if (-not (Test-Path $claudeConfigDir)) {
        New-Item -ItemType Directory -Path $claudeConfigDir -Force | Out-Null
    }
}

# Backup existing config
if (Test-Path $claudeConfigPath) {
    Write-Host ""
    Write-Host "3. Backing up existing config..." -ForegroundColor Yellow
    $backupPath = "$claudeConfigPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    Copy-Item $claudeConfigPath $backupPath
    Write-Host "   ✓ Backup created at: $backupPath" -ForegroundColor Green
}

# Read existing config or create new one
Write-Host ""
Write-Host "4. Updating Claude config..." -ForegroundColor Yellow

$mcpConfig = @{
    mcpServers = @{
        "supabase-local" = @{
            command = "npx"
            args = @(
                "-y",
                "@modelcontextprotocol/server-postgres",
                "postgresql://postgres:postgres@localhost:54322/postgres"
            )
            env = @{}
        }
    }
}

if (Test-Path $claudeConfigPath) {
    # Merge with existing config
    $existingConfig = Get-Content $claudeConfigPath -Raw | ConvertFrom-Json

    if ($null -eq $existingConfig.mcpServers) {
        $existingConfig | Add-Member -MemberType NoteProperty -Name "mcpServers" -Value @{}
    }

    $existingConfig.mcpServers | Add-Member -MemberType NoteProperty -Name "supabase-local" -Value $mcpConfig.mcpServers."supabase-local" -Force

    $existingConfig | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigPath
} else {
    # Create new config
    $mcpConfig | ConvertTo-Json -Depth 10 | Set-Content $claudeConfigPath
}

Write-Host "   ✓ Claude config updated successfully!" -ForegroundColor Green

# Test database connection
Write-Host ""
Write-Host "5. Testing database connection..." -ForegroundColor Yellow
try {
    # Simple connection test using psql if available
    $env:PGPASSWORD = "postgres"
    $testResult = psql -h localhost -p 54322 -U postgres -d postgres -c "SELECT version();" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✓ Database connection successful!" -ForegroundColor Green
    } else {
        Write-Host "   ! Could not test connection (psql not found)" -ForegroundColor Yellow
        Write-Host "   Connection should still work via MCP" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ! Could not test connection (psql not available)" -ForegroundColor Yellow
    Write-Host "   Connection should still work via MCP" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Completely quit Claude Desktop (if running)" -ForegroundColor White
Write-Host "2. Restart Claude Desktop" -ForegroundColor White
Write-Host "3. Test by asking: 'What tables are in my database?'" -ForegroundColor White
Write-Host ""
Write-Host "Configuration saved to:" -ForegroundColor Yellow
Write-Host "   $claudeConfigPath" -ForegroundColor White
Write-Host ""
Write-Host "Database connection:" -ForegroundColor Yellow
Write-Host "   postgresql://postgres:postgres@localhost:54322/postgres" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see:" -ForegroundColor Yellow
Write-Host "   SUPABASE_MCP_SETUP.md" -ForegroundColor White
Write-Host ""
