#!/bin/bash

if [[ "$1" == "dev" ]]; then
    docker compose -f "compose-dev.yaml" up --build --remove-orphans
elif [[ "$1" == "prod" ]]; then
    docker compose -f "compose-prod.yaml" up --build --remove-orphans
else
    echo "Usage: $0 {dev|prod}"
    exit 1
fi
