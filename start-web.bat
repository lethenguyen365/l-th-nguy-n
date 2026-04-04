@echo off
title FINAL PRO - QR + DEMO + PRICING
cd /d "%~dp0"
if exist raovat-v3.db del /f /q raovat-v3.db
if not exist node_modules call npm.cmd install
call npm.cmd start
pause
