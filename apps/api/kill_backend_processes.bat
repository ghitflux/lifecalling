@echo off
echo ============================================================
echo MATANDO PROCESSOS DO BACKEND NA PORTA 8000
echo ============================================================
echo.

echo [1/2] Identificando processos na porta 8000...
netstat -ano | findstr :8000
echo.

echo [2/2] Matando processos...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000') do (
    echo Matando processo %%a...
    taskkill /PID %%a /F
)

echo.
echo ============================================================
echo PROCESSOS ENCERRADOS
echo ============================================================
echo.
echo Agora execute: start_backend.bat
echo.

pause
