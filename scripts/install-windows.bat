@echo off
REM install-windows.bat - Windows installer for Video Clipping Tools
echo ==========================================================
echo       🪟 Installing Video Clipping Tools Suite (Windows)
echo ==========================================================

where winget >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [1/3] Installing FFmpeg, yt-dlp, and Python via winget...
    winget install Gyan.FFmpeg --accept-source-agreements --accept-package-agreements
    winget install yt-dlp.yt-dlp --accept-source-agreements --accept-package-agreements
    winget install Python.Python.3.11 --accept-source-agreements --accept-package-agreements
) else (
    echo [1/3] Winget not found. Please ensure FFmpeg and Python are installed.
)

echo [2/3] Installing Python video clipping tools...
python -m pip install --upgrade pip
python -m pip install -r "%~dp0..\requirements.txt"

echo [3/3] Setting up CLI helpers...
set USER_BIN=%USERPROFILE%\.local\bin
if not exist "%USER_BIN%" mkdir "%USER_BIN%"
copy /Y "%~dp0..\bin\*" "%USER_BIN%\"

echo ==========================================================
echo  🎉 Installation complete! Add %USERPROFILE%\.local\bin to your PATH.
echo ==========================================================
pause
