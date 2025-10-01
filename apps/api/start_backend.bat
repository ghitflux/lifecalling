@echo off
echo ============================================================
echo INICIANDO BACKEND - Lifecalling API
echo ============================================================
echo.

cd /d D:\apps\trae\lifecallingv1\lifecalling\apps\api

echo [1/3] Verificando diretorio...
echo Diretorio atual: %CD%
echo.

echo [2/3] Verificando Python...
python --version
echo.

echo [3/3] Iniciando Uvicorn...
echo Backend sera iniciado em: http://localhost:8000
echo.
echo Pressione Ctrl+C para parar o servidor
echo ============================================================
echo.

python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause
