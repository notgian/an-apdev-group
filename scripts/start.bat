@echo off

if "%~1"=="dev" (
    docker compose -f "compose-dev.yaml" up --build --remove-orphans
) else if "%~1"=="prod" (
    docker compose -f "compose-prod.yaml" up --build --remove-orphans
) else (
    echo Usage: %0 {dev^|prod}
    exit /b 1
)
