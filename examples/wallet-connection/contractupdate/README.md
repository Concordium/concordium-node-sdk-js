# `concordium-dapp-contractupdate`

Sample dApp that demonstrates how the libraries may be used to implement a robust dApp.
It allows the user to invoke any method on any smart contract on the chain either via the Browser Wallet or WalletConnect.

## Install

Run

```shell
yarn
```

to install dependencies.

## Run

Run the app in development mode with

```shell
yarn start
```

This spins up a server which serves the app on [http://localhost:3000](http://localhost:3000).

Linting errors will appear in the console.

Changes to the source code will cause the page to refresh automatically.

## Build

Build the app for production using

```shell
yarn build
```

This will drop an optimized and minified bundle in the `./build` folder that is ready to be deployed.

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Docker

The project includes a dockerfile for building the app for production and running it in a container.
The default build image `node:16-slim` may be overridden using build arg `build_image`.

The easiest way to build and run the app is with Docker Compose:

```shell
docker-compose up --build
```

This command will build the app with default settings and deploy it in a HTTPd server container that by default listens to port 8080.

The Compose spec is parameterized as follows:

-   `CONTRACTUPDATE_IMAGE` (default: `concordium-dapp-contractupdate:test`):
    Image to build and/or start.
    Remove the `--build` flag to start an existing image without building it.
-   `CONTRACTUPDATE_PORT` (default: `8080`):
    Port to run the server on.

Note that the Dockerfile doesn't build using the repository's `yarn.lock` file
as it resides in the repository root due to this being a yarn workspace.
