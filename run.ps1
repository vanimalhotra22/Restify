# run.ps1
# Sleeplens Full-Stack Run Script (Windows PowerShell)

Clear-Host
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host "🚀          Sleeplens Diagnostics & AI Coaching           " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Magenta
Write-Host ""

# 1. Set terminal encoding to UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$env:PYTHONIOENCODING = "utf-8"

# 2. Check Python Dependencies
Write-Host "🔍 Verifying python modules..." -ForegroundColor Yellow
$py_check = python -c "import fastapi, uvicorn, sqlalchemy, xgboost, sklearn; print('All Python imports OK')" 2>$null
if ($py_check -ne "All Python imports OK") {
    Write-Host "⚠️ Warning: Some Python dependencies might be missing. Attempting to install them..." -ForegroundColor Red
    python -m pip install fastapi uvicorn sqlalchemy xgboost scikit-learn python-dotenv google-generativeai pandas numpy
} else {
    Write-Host "✅ Python dependencies satisfied." -ForegroundColor Green
}

# 3. Check node_modules in frontend
Write-Host "🔍 Verifying frontend node modules..." -ForegroundColor Yellow
if (-not (Test-Path "frontend/node_modules")) {
    Write-Host "⚠️ Warning: node_modules folder is missing. Installing frontend packages (this may take a minute)..." -ForegroundColor Red
    cd frontend
    npm install
    cd ..
} else {
    Write-Host "✅ Frontend dependencies satisfied." -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Launching backend and frontend concurrently..." -ForegroundColor Cyan

# 4. Launch Backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PYTHONIOENCODING='utf-8'; python -m uvicorn backend.main:app --reload --port 8000" -Title "Sleeplens Backend API"

# 5. Launch Frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start" -Title "Sleeplens React App"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 Launch Complete!" -ForegroundColor Green
Write-Host "- Backend: http://localhost:8000" -ForegroundColor Green
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "- Real-time Streaming WebSocket is active" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Press any key to close this launcher..." -ForegroundColor Gray
Read-Host
