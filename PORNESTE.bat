@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
title Programari Unghii
echo.
echo  ==== Programari Unghii ====
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [!] Node.js nu este instalat. Il instalez acum ^(LTS^)...
  winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
  echo.
  echo Node.js a fost instalat. INCHIDE aceasta fereastra si da dublu-click din nou pe PORNESTE.bat
  pause
  exit /b
)

where git >nul 2>nul
if not errorlevel 1 (
  if exist .git (
    echo Actualizez codul de pe GitHub...
    git pull --ff-only origin main
  )
)

if not exist node_modules (
  echo Instalez pachetele ^(prima data dureaza cateva minute^)...
  call npm install
  if errorlevel 1 ( echo [!] npm install a esuat. Trimite-mi mesajul de eroare. & pause & exit /b )
) else (
  call npm install --no-audit --no-fund >nul 2>nul
)

:menu
echo.
echo  Alege:
echo    1 = Browser ^(calculator^)
echo    2 = Telefon prin Expo Go - aceeasi retea Wi-Fi ^(Android si iPhone^)
echo    3 = Telefon prin Expo Go - TUNEL ^(daca varianta 2 nu se conecteaza^)
echo    4 = Construieste aplicatia Android ^(APK de instalat^)
echo    5 = Iesire
echo.
set /p ch=Scrie numarul si apasa Enter: 
if "%ch%"=="1" ( call npx expo start --web & goto menu )
if "%ch%"=="2" ( call npx expo start & goto menu )
if "%ch%"=="3" ( call npx expo start --tunnel & goto menu )
if "%ch%"=="4" (
  echo.
  echo Ai nevoie de cont gratuit pe https://expo.dev ^(te va intreba datele^).
  call npx eas-cli@latest login
  call npx eas-cli@latest init --non-interactive
  call npx eas-cli@latest build -p android --profile preview
  goto menu
)
if "%ch%"=="5" exit /b
goto menu
