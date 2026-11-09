@echo off
chcp 65001 >nul
cd /d "%~dp0"
:loop
node backend/server.js
timeout /t 5 /nobreak >nul
goto loop
