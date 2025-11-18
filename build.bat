@echo off
echo Building File Manager Executables

if exist build rmdir /s /q build
mkdir build

echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies
    pause
    exit /b %errorlevel%
)

echo Compiling TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo TypeScript compilation failed
    pause
    exit /b %errorlevel%
)

echo Creating executables...
call npm run build:exe
if %errorlevel% neq 0 (
    echo Executable creation failed
    pause
    exit /b %errorlevel%
)

echo Build completed
dir /b build
pause
