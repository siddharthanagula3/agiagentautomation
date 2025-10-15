@echo off
echo ===================================
echo Supabase MCP Server Setup
echo ===================================
echo.

REM Get the Claude config path
set CLAUDE_CONFIG=%APPDATA%\Claude\claude_desktop_config.json

echo Claude config location:
echo %CLAUDE_CONFIG%
echo.

REM Check if directory exists
if not exist "%APPDATA%\Claude" (
    echo Creating Claude config directory...
    mkdir "%APPDATA%\Claude"
)

REM Backup existing config if it exists
if exist "%CLAUDE_CONFIG%" (
    echo Backing up existing config...
    copy "%CLAUDE_CONFIG%" "%CLAUDE_CONFIG%.backup-%date:~-4,4%%date:~-10,2%%date:~-7,2%"
    echo Backup created!
    echo.
)

REM Create the MCP configuration
echo Creating MCP configuration...
(
echo {
echo   "mcpServers": {
echo     "supabase-local": {
echo       "command": "npx",
echo       "args": [
echo         "-y",
echo         "@modelcontextprotocol/server-postgres",
echo         "postgresql://postgres:postgres@localhost:54322/postgres"
echo       ],
echo       "env": {}
echo     }
echo   }
echo }
) > "%CLAUDE_CONFIG%"

echo.
echo ===================================
echo Setup Complete!
echo ===================================
echo.
echo Configuration saved to:
echo %CLAUDE_CONFIG%
echo.
echo Next steps:
echo 1. Make sure Supabase is running: supabase start
echo 2. Completely quit Claude Desktop
echo 3. Restart Claude Desktop
echo 4. Test by asking: "What tables are in my database?"
echo.
pause
