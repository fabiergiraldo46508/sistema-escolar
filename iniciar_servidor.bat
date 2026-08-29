11@echo off
title Servidor Backend - Sistema Escolar
echo ======================================================
echo    INICIANDO SERVIDOR BACKEND (FLASK API - PUERTO 5000)
echo ======================================================
cd /d "%~dp0backend"

if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo [AVISO] Entorno virtual no encontrado. Usando Python del sistema...
)

python app.py
pause
