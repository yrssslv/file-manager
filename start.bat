@echo off
call npm run build
if %errorlevel% neq 0 exit /b %errorlevel%
node dist/app.mjs
