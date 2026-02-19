# an-apdev-group

Will improve description here when we get to it.

# Running with Docker
The application suite can be run using docker. These commands MUST be executed in the root directory of the project (the same directory as this README file).

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

## Running the development build
Using the command line:
```
docker compose -f "compose-dev.yaml" up --build --remove-orphans
```
To close the containers:

```
docker compose -f "compose-dev.yaml" down
```

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
