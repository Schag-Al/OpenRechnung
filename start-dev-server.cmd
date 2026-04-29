@echo off
setlocal
cd /d "%~dp0"

if not exist ".tools\node\node.exe" (
  echo Lokale Node-Version wurde nicht gefunden: .tools\node\node.exe
  echo Bitte zuerst die Projekt-Abhaengigkeiten wiederherstellen.
  pause
  exit /b 1
)

if not exist "node_modules\next\dist\bin\next" (
  echo Next.js wurde nicht gefunden. Bitte im Projektordner zuerst npm install ausfuehren.
  pause
  exit /b 1
)

echo Starte OpenRechnung unter http://127.0.0.1:3000
echo Dieses Fenster offen lassen, solange du die App nutzen moechtest.
".tools\node\node.exe" "node_modules\next\dist\bin\next" dev --hostname 127.0.0.1 --port 3000

pause
