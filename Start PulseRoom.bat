@echo off
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo First run: installing Electron ^(one time only^)...
  call npm install --no-audit --no-fund
)
start "" "node_modules\electron\dist\electron.exe" .
