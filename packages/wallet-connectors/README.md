# `@concordium/wallet-connectors`

Interfaces for interacting with wallets along with implementations for Browser Wallet and WalletConnect (v2).
It’s written in TypeScript and has no dependencies to any UI framework.

The library takes away the complexity involved with interacting with both Browser Wallet and Mobile Wallets (via WalletConnect)
such that dApps only need to interact with interfaces that abstract away the underlying protocol.

## Interfaces

### `WalletConnector`

An object of this type represents some connection type and manages connections over the corresponding protocol.

The main method of this interface is `.connect()`, which attempts to initiate a connection.
If successful, the returned promise resolves to a `WalletConnection`.

Connectors usually hold a `WalletConnectionDelegate` reference that they share with the application.
Relevant events pass from the connectors to the application through this delegate.

Implementations may support multiple active connections from the same connector.

### `WalletConnection`

A connection allows the application to interact with a wallet.
The following interactions are supported:

- `signMessage`: Ask the wallet to sign a message and return it back to the dApp.
- `signAndSendTransaction`: Ask the wallet to sign a transaction and submit it to a node.

The wallet is responsible for prompting its user for approval of all interactions.

### `WalletConnectionDelegate`

A collection of generic event handlers for common events.
Applications usually define a single delegate that they share between all connectors.
This allows the application to handle all events from all kinds of connections in a single place.

## Usage Example

First define a delegate `MyDelegate` for keeping track of the connected account and chain for each connection:

```typescript
import {
    BrowserWalletConnector,
    WalletConnectConnector,
    WalletConnection,
    WalletConnectionDelegate,
} from '@concordium/wallet-connectors';

class MyDelegate implements WalletConnectionDelegate {
    accounts = new Map<WalletConnection, string | undefined>();
    chains = new Map<WalletConnection, string | undefined>();

    onAccountChanged = (connection: WalletConnection, address: string | undefined) => {
        this.accounts.set(connection, address);
    };

    onChainChanged = (connection: WalletConnection, genesisHash: string) => {
        this.chains.set(connection, genesisHash);
    };

    onConnected = (connection: WalletConnection, address: string | undefined) => {
        this.onAccountChanged(connection, address);
    };

    onDisconnected = (connection: WalletConnection) => {
        this.accounts.delete(connection);
        this.chains.delete(connection);
    };
}
```

Then write some application code that only references the connection through the generic `WalletConnection` interface:

```typescript
async function doSomethingInteresting(connection: WalletConnection, account: string, ...) {
    ...
    const txHash = await connection.signAndSendTransaction(account, ...);
    ...
}
```

In the appropriate context, set up connectors for both Browser Wallet and WalletConnect
(adding appropriate values of `walletConnectOpts` and `network`) and open connections to both of them:

```typescript
const delegate = new MyDelegate();
const browserWalletConnector = await BrowserWalletConnector.create(delegate);
const walletConnectConnector = await WalletConnectConnector.create(walletConnectOpts, delegate, network);

const browserWalletConnection = await browserWalletConnector.connect();
const walletConnectConnection = await walletConnectConnector.connect();
```

The current state of all connections is available in the fields of `delegate`.
This is used when invoking the application function above:

```typescript
doSomethingInteresting(connection, delegate.accounts.get(connection)!, ...)
```

where `connection` is either `browserWalletConnection` or `walletConnectConnection`.

## Usage in React

Use the React component [`WithWalletConnector`](../react-components/src/WithWalletConnector.ts) in
[`@concordium/react-components`](../react-components)
to easily integrate this library into a React app.

## Build

Run

```shell
yarn
yarn build
```

to compile the TypeScript files into `./dist` along with type declarations and source maps.
