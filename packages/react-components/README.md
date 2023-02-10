# `@concordium/react-components`

React components and hooks for implementing features commonly needed by dApps.
The components only manage React state and pass data to application components - no actual HTML is being rendered.

As much as possible is done to help make sure that the dApp is connected to a wallet/account
on the expected network while taking into account that the user may decide to switch network.

## Components

### [`WithWalletConnector`](./src/WithWalletConnector.ts)

Component that bridges [`@concordium/wallet-connectors`](../wallet-connectors) into a React context by
managing connection state and network information.
This component significantly reduces the complexity of integrating with wallets,
even if one only need to support a single protocol and network.

The interface for managing the connectors is exposed through [`WalletConnectionProps`](./src/WithWalletConnector.ts#WalletConnectionProps)
which is passed to the child component.

_Example: Interact with wallets connected to Testnet:_

Initialize the network configuration and wrap the component `MyAppComponent` that needs to do wallet interaction
in `WithWalletConnector`:

```typescript jsx
import { Network, WalletConnectionProps, WithWalletConnector } from '@concordium/react-components';

const testnet: Network = {
    name: 'testnet',
    genesisHash: '4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796',
    jsonRpcUrl: 'https://json-rpc.testnet.concordium.com',
    ccdScanBaseUrl: 'https://testnet.ccdscan.io',
};

function MyRootComponent() {
    return <WithWalletConnector network={network}>{(props) => <MyAppComponent {...props} />}</WithWalletConnector>;
}

function MyAppComponent(props: WalletConnectionProps) {
    // TODO Manage connections using the interface exposed through WalletConnectionProps (usually using useWalletConnectorSelector)...
}
```

Use `props.setActiveConnectorType(...)` from within `MyAppComponent` to set up a connector,
and make it available on `props.activeConnector`.
This is most easily done using [`useWalletConnectorSelector`](#usewalletconnectorselector).

Connector types for the Browser Wallet and WalletConnect connectors are usually initialized like so:

```typescript
export const BROWSER_WALLET = ephemeralConnectorType(BrowserWalletConnector.create);
export const WALLET_CONNECT = ephemeralConnectorType(WalletConnectConnector.create.bind(undefined, WALLET_CONNECT_OPTS));
```

Initiate a connection by invoking `connect` on a connector.
This is most easily done using the hooks `useConnection` and `useConnect`:

```typescript
const { activeConnector, network, connectedAccounts, genesisHashes, ... } = props;
const { connection, setConnection, account, genesisHash } = useConnection(activeConnector, connectedAccounts, genesisHashes);
const { connect, isConnecting, connectError } = useConnect(activeConnector, setConnection);
```

The app uses the function `connect` to initiate a new connection from `activeConnector`.
The fields `isConnecting` and `connectError` are used to render the connection status.
Once established, the connection and its state are exposed in the following fields:

-   `connection`: The `WalletConnection` object that the app uses to interact with the wallet.
    Is `undefined` if there is no established connection.
-   `account`: The account that `connection` is associated with in the wallet
    or the empty string if the connection isn't associated with an account.
-   `genesisHash`: The hash of the genesis block for the chain that `account` lives on
    if this value has been reported by the wallet or `undefined` otherwise.
    This may for instance be used to check that `account` lives on the expected network.
    Use with care as some wallets don't provide this value reliably.

All the fields hold the value `undefined` until the connection has been established and again after it's been disconnected.

See [the sample dApp](../../samples/contractupdate/src/Root.tsx) for a complete example.

## Hooks

### [`useWalletConnectorSelector`](./src/useWalletConnectorSelector.ts)

Helper hook for computing the selected/connected/disabled state of a given connector type.

_Example: Create a button for toggling a connector_

The button accepts all the `props` exposed by `WithWalletConnector`
as well as the particular `ConnectorType` that it manages:

```typescript jsx
import { ConnectorType, useWalletConnectorSelector, WalletConnectionProps } from '@concordium/react-components';

interface Props extends WalletConnectionProps {
    connectorType: ConnectorType;
    connectorName: string;
}

export function WalletConnectorButton(props: Props) {
    const { connectorType, connectorName } = props;
    const { isSelected, isConnected, isDisabled, select } = useWalletConnectorSelector(connectorType, props);
    return (
        // TODO Render button based on the computed properties and invoke `select` on click...
    );
}
```

It's important that the `ConnectorType` reference passed to the hook is fixed.

See [the sample dApp](../../samples/contractupdate/src/WalletConnectorButton.tsx) for a complete example.

### [`useContractSelector`](./src/useContractSelector.ts)

Hook for managing the state of an input field and lookup smart contract info by its index.

_Example: Look up the info of a smart contract by its index specified in an input field_

```typescript jsx
import React, { useState } from 'react';
import { Network, useContractSelector, WalletConnection } from '@concordium/react-components';

interface Props {
    network: Network;
    connection: WalletConnection | undefined;
    connectedAccount: string | undefined;
}

export function ContractStuff({ connection }: Props) {
    const [input, setInput] = useState('');
    const { selected, isLoading, validationError } = useContractSelector(connection?.getJsonRpcClient(), input);
    return (
        // TODO Render a text input using `input`/`setInput`.
        // TODO Render the selected contract, if present.
    );
}
```

See [the sample dApp](../../samples/contractupdate/src/App.tsx) for a complete example.

## Build

Run

```shell
yarn
yarn build
```

to compile the TypeScript files into `./dist` along with type declarations and source maps.
