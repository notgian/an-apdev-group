# an-apdev-group

Will improve description here when we get to it.

# Running
The application suite can be run using the provided application scripts
```shell
# script usage
# ./scripts/start.[bat|ps1|sh] [prod|dev]

# For Linux or Mac
./scripts/start.sh prod
./scripts/start.sh dev

# For Windows PowerShell
./scripts/start.ps1 prod
./scripts/start.ps1 dev

# For Windows CMD
./scripts/start.bat prod
./scripts/start.bat dev
```

It can also be stopped using the stop scripts

```shell
# Linux or Mac
./scripts/stop.sh

# Windows PowerShell
./scripts/stop.ps1

# Windows CMD
./scripts/stop.bat

```

## Manual Running
The application suite can be manually run using docker. These commands MUST be executed in the root directory of the project (the same directory as this README file).

Build and run the docker containers with the following command:
```
docker compose -f "compose-prod.yaml" up --build --remove-orphans
```
This runs the production build. Take note that these builds are IMMUTABLE docker containers. For development instructions see the [**Development**](# Development) section.

Close the docker containers using the following command:
```
docker compose -f "compose-prod.yaml" down
```

# Development

## (Proposed) File Project Structure
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

## Generating Database Data
There is a custom script that can generate data that can be run from w/in the docker container. Use the following command to run it:

```shell
docker exec -it express-api npm run datagen
```

Note that in its current state, not all numbers and data are realistic, which will be fixed in a future iteration of the script once it can use the API endpoints too.

### Note about the docker method
The docker method that this repo is using right now causes the node modules to be *completely reinstalled* every single time you run it. This is kind of essential to make sure that our local files don't screw with it. With this in mind, this means that **it may not be possible to run the applications using the docker method when you are not connected to the internet**.

In this case, you can do the following:
1. Run `npm install` in both the `./web` and `./api` subdirectories (yes, you NEED to cd into each and run the command individually for both)
2. On one terminal session, cd into `./web` and run `npm run dev` or `npm run start` for dev or prod builds respectively (you probably want the dev one). This runs the WEBSITE SERVER.
3. On another terminal session, cd into `./api` and run `npm run dev` or `npm run start` for dev or prod builds respectively (you probably want the dev one). This runs the API SERVER.

## Separation of Website and API applications
While this is on one monorepo, the website server application is separated from the api server application. When developing on either one of the applications, they need to be thought of different applications. Naturally this means that **node modules installed are not shared between the two!**

### Installing node modules
When installing node modules change directory into either the `./web` or `./api` subdirectory first. This will add them to the package.json, but it does not automatically get added to the docker containers. To make these modules accessible by the containers, you need to **close and rerun the containers.** When running the containers again, it will reinstall the modules on the docker container, complete with the new ones.
