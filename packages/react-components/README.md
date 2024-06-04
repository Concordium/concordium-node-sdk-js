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
import { Network, TESTNET, WalletConnectionProps, WithWalletConnector } from '@concordium/react-components';

function MyRootComponent() {
    return <WithWalletConnector network={TESTNET}>{(props) => <MyAppComponent {...props} />}</WithWalletConnector>;
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
export const WALLET_CONNECT = ephemeralConnectorType((delegate, network) =>
    WalletConnectConnector.create(walletConnectOptions, delegate, network, walletConnectNamespaceConfig)
);
```

where `walletConnectOptions` is the initialization configuration for WalletConnect
and `walletConnectNamespaceConfig` is the Concordium-specific connection configuration (optional; defaults to all supported methods and events).
In practice, both of these values are usually constants.
See [sample configuration](../../examples/wallet-connection/sign-message/src/config.ts) for a complete example.

Initiate a connection by invoking `connect` on a connector.
This is most easily done using the hooks `useConnection` and `useConnect`:

```typescript
const { activeConnector, network, connectedAccounts, genesisHashes, ... } = props;
const { connection, setConnection, account, genesisHash } = useConnection(activeConnector, connectedAccounts, genesisHashes);
const { connect, isConnecting, connectError } = useConnect(activeConnector, setConnection);
```

The app uses the function `connect` to initiate a new connection from `activeConnector`.
The fields `isConnecting` and `connectError` are used to render the connection status.
If `activeConnector` is `undefined` then so is `connect` as it doesn't make sense to call it in that case.
This may be used to disable a button whose click handler invokes the function, like for instance:

```tsx
<Button type="button" onClick={connect} disabled={!connect}>
    Connect
</Button>
```

Once established, the connection and its state are exposed in the following fields:

- `connection`: The `WalletConnection` object that the app uses to interact with the wallet.
  Is `undefined` if there is no established connection.
- `account`: The account that `connection` is associated with in the wallet
  or the empty string if the connection isn't associated with an account.
- `genesisHash`: The hash of the genesis block for the chain that `account` lives on
  if this value has been reported by the wallet or `undefined` otherwise.
  This may for instance be used to check that `account` lives on the expected network.
  Use with care as some wallets don't provide this value reliably.

All the fields hold the value `undefined` until the connection has been established and again after it's been disconnected.

See [the sample dApp](../../examples/wallet-connection/contractupdate/src/Root.tsx) for a complete example.

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

See [the sample dApp](../../examples/wallet-connection/contractupdate/src/WalletConnectorButton.tsx) for a complete example.

### [`useContractSelector`](./src/useContractSelector.ts)

Hook for managing the state of an input field and lookup smart contract info by its index.

_Example: Look up the info of a smart contract by its index specified in an input field_

```typescript jsx
import React, { useState } from 'react';
import { Network, useContractSelector } from '@concordium/react-components';
import { ConcordiumGRPCClient } from '@concordium/web-sdk';

interface Props {
    rpc: ConcordiumGRPCClient | undefined;
}

export function ContractStuff({ rpc }: Props) {
    const [input, setInput] = useState('');
    const { selected, isLoading, validationError } = useContractSelector(rpc, input);
    return (
        // TODO Render a text input using `input`/`setInput`.
        // TODO Render the selected contract, if present.
    );
}
```

Use the hook [`useGrpcClient`](#usegrpcclient) below to obtain a `ConcordiumGRPCClient` instance.
See [the sample dApp](../../examples/wallet-connection/contractupdate/src/Root.tsx) for a complete example.

### [`useModuleSchemaRpc`](./src/useModuleSchemaRpc.ts)

Hook for resolving the schema of a smart contract from the chain.
The schema is used to construct the payload of invocations of the smart contract.

_Example: Fetch schema of a provided smart contract_

```typescript jsx
import React, { useState } from 'react';
import { Info, Network, Schema, useModuleSchemaRpc } from '@concordium/react-components';
import { ConcordiumGRPCClient } from '@concordium/web-sdk';

interface Props {
    rpc: ConcordiumGRPCClient;
    contract: Info;
}

export function ContractSchemaStuff({ rpc }: Props) {
    const [schemaRpcError, setSchemaRpcError] = useState('');
    const schemaRpcResult = useModuleSchemaRpc(rpc, contract.moduleRef, setSchemaRpcError);
    const schema: Schema = schemaRpcResult?.schema;
    // ...
}
```

Use the hook [`useGrpcClient`](#usegrpcclient) below to obtain a `ConcordiumGRPCClient` instance.
See [the sample dApp](../../examples/wallet-connection/contractupdate/src/Root.tsx) for a complete example.

### [`useGrpcClient`](./src/useGrpcClient.ts)

React hook that obtains a gRPC Web client for interacting with a node on the appropriate network.

_Example: Periodically fetch height of "best block"_

```typescript
const rpc = useGrpcClient(network);
const [height, setHeight] = useState<bigint>();
useEffect(() => {
    const t = setInterval(() => {
        if (rpc) {
            rpc.getConsensusStatus()
                .then((s) => s.bestBlockHeight)
                .then(setHeight)
                .catch(console.error);
        }
    }, intervalMs);
    return () => clearTimeout(t);
}, [rpc]);
```

The client is also used as an input to the hook [`useContractSelector`](#usecontractselector) above.

## Build

Run

```shell
yarn
yarn build
```

to compile the TypeScript files into `./dist` along with type declarations and source maps.
