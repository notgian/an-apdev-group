if ($args[0] -eq "dev") {
    docker compose -f "compose-dev.yaml" up --build --remove-orphans
}
elseif ($args[0] -eq "prod") {
    docker compose -f "compose-prod.yaml" up --build --remove-orphans
}
else {
    Write-Host "Usage: .\script.ps1 {dev|prod}"
    exit 1
}
