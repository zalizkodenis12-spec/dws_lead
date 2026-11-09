@echo off
cd /d "d:\Мої сайти\My_own_site\dws-lead"
:loop
node backend/server.js
timeout /t 5 /nobreak >nul
goto loop
