# an-apdev-group


# (Proposed) File Project Structure
The application will be divided into the website itself and the API, just for clearer organization. The project root directory will have the main docker-compose file(s) and the readme. 

```
app/
├── web/              # Website
│   └──routes/
│   └──Dockerfile
│   └──index.js
├── api/              # API (and db)
│   └──routes/
│   └──Dockerfile
│   └──index.js
├── docker-compose.yml
└── README.md
```

# Running with docker
Using the command line (development):
```
docker compose -f "compose-dev.yaml" up --build
```
Production:
```
docker compose -f "compose-prod.yaml" up --build
```

To close the docker containers after detatching, run either of the commands applicable to either the dev or prod environment. Make sure these are run in the project root directory (same directory as this README file)

```
docker compose -f "compose-dev.yaml" down

docker compose -f "compose-prod.yaml" down

```
