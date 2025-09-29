@echo off
echo 🧹 Starting AGI Agent Automation cleanup...

REM Test files and reports
echo Deleting test files...
if exist test-website-comprehensive.cjs del test-website-comprehensive.cjs
if exist test-website-comprehensive.js del test-website-comprehensive.js
if exist website-test-report-2025-09-28.json del website-test-report-2025-09-28.json

REM Documentation/temporary files
echo Deleting documentation files...
if exist CLAUDE.md del CLAUDE.md
if exist gemini.md del gemini.md
if exist README-Phase4.md del README-Phase4.md
if exist QUICKSTART.js del QUICKSTART.js

REM Build artifacts
echo Deleting build artifacts...
if exist dist rmdir /s /q dist
if exist bun.lockb del bun.lockb

REM Test directory
echo Deleting test directory...
if exist src\test rmdir /s /q src\test

REM Unused page files
echo Deleting unused pages...
if exist src\pages\AboutPage.tsx del src\pages\AboutPage.tsx
if exist src\pages\BlogPage.tsx del src\pages\BlogPage.tsx
if exist src\pages\BlogPostPage.tsx del src\pages\BlogPostPage.tsx
if exist src\pages\CareersPage.tsx del src\pages\CareersPage.tsx
if exist src\pages\ContactPage.tsx del src\pages\ContactPage.tsx
if exist src\pages\FeaturesPage.tsx del src\pages\FeaturesPage.tsx
if exist src\pages\LegalPage.tsx del src\pages\LegalPage.tsx
if exist src\pages\ChatInterface.tsx del src\pages\ChatInterface.tsx
if exist src\pages\DashboardHomePage.tsx del src\pages\DashboardHomePage.tsx
if exist src\pages\NotFoundPage.tsx del src\pages\NotFoundPage.tsx

REM Unused component files
echo Deleting unused components...
if exist src\components\ChatGPTHeader.tsx del src\components\ChatGPTHeader.tsx
if exist src\components\ChatGPTInput.tsx del src\components\ChatGPTInput.tsx
if exist src\components\ChatGPTMessage.tsx del src\components\ChatGPTMessage.tsx
if exist src\components\ChatGPTSidebar.tsx del src\components\ChatGPTSidebar.tsx
if exist src\components\CompleteAdminDashboard.tsx del src\components\CompleteAdminDashboard.tsx
if exist src\components\CompleteAIEmployeeChat.tsx del src\components\CompleteAIEmployeeChat.tsx
if exist src\components\CompleteAIEmployeeMarketplace.tsx del src\components\CompleteAIEmployeeMarketplace.tsx
if exist src\components\Header.tsx del src\components\Header.tsx
if exist src\components\Sidebar.tsx del src\components\Sidebar.tsx
if exist src\components\SimpleHeader.tsx del src\components\SimpleHeader.tsx
if exist src\components\MessageBubble.tsx del src\components\MessageBubble.tsx
if exist src\components\MessageComposer.tsx del src\components\MessageComposer.tsx
if exist src\components\AuthDebugger.tsx del src\components\AuthDebugger.tsx
if exist src\components\HideLoader.tsx del src\components\HideLoader.tsx
if exist src\components\RealtimeDashboard.tsx del src\components\RealtimeDashboard.tsx
if exist src\components\RealtimeNotification.tsx del src\components\RealtimeNotification.tsx
if exist src\components\AIEmployeeChat.tsx del src\components\AIEmployeeChat.tsx

REM Empty navigation directory
echo Cleaning up empty directories...
if exist src\components\navigation rmdir /s /q src\components\navigation

REM Optimize package.json
echo Optimizing package.json...
if exist package_optimized.json (
    copy package_optimized.json package.json
    del package_optimized.json
)

echo ✅ Cleanup complete!
echo 📁 Cleaned up unnecessary files from the project
echo.
echo 📂 To see remaining structure, run: dir src /s
pause
