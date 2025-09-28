# PowerShell script to update all auth-hooks imports to unified-auth-store

$files = @(
    "src/pages/dashboard/AIEmployeesPage.tsx",
    "src/pages/dashboard/APIKeysPage.tsx",
    "src/pages/dashboard/BillingPage.tsx",
    "src/pages/dashboard/JobsPage.tsx",
    "src/pages/dashboard/LogsPage.tsx",
    "src/pages/dashboard/NotificationsPage.tsx",
    "src/pages/dashboard/ProcessingPage.tsx",
    "src/pages/dashboard/ProfilePage.tsx",
    "src/pages/dashboard/ReportsPage.tsx",
    "src/pages/dashboard/SettingsPage.tsx",
    "src/pages/dashboard/TeamPage.tsx",
    "src/pages/dashboard/WebhooksPage.tsx",
    "src/pages/dashboard/WorkforcePage.tsx",
    "src/components/layout/DashboardHeader.tsx",
    "src/components/Header.tsx",
    "src/pages/auth/RegisterPage.tsx",
    "src/components/CompleteAIEmployeeChat.tsx",
    "src/hooks/useRealtime.ts",
    "src/components/auth/LoginForm.tsx",
    "src/components/auth/RegisterForm.tsx",
    "src/components/auth/PermissionGate.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Updating $file"
        (Get-Content $file) -replace "from '../../contexts/auth-hooks'", "from '../../stores/unified-auth-store'" -replace "from '../contexts/auth-hooks'", "from '../stores/unified-auth-store'" -replace "from '../../contexts/auth-hooks'", "from '../../stores/unified-auth-store'" | Set-Content $file
        (Get-Content $file) -replace "useAuth\(\)", "useAuthStore()" | Set-Content $file
        (Get-Content $file) -replace "const { user, loading } = useAuthStore\(\);", "const { user, isLoading } = useAuthStore();" | Set-Content $file
        (Get-Content $file) -replace "loading", "isLoading" | Set-Content $file
    }
}

Write-Host "All files updated!"
