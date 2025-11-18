@echo off
echo Building File Manager Executables
echo.

if exist build rmdir /s /q build
mkdir build

echo Installing dependencies...
call npm install

echo Compiling TypeScript...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b %errorlevel%
)

echo Creating executables...
call npm run build:exe
if %errorlevel% neq 0 (
    echo Executable creation failed!
    exit /b %errorlevel%
)

echo.
echo Build completed successfully!
echo.
dir /b build
echo.
pause
