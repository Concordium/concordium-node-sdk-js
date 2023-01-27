# `@concordium/react-components`

React components and hooks for implementing features commonly needed by dApps.
The components only manage React state and pass data to application components - no actual HTML is being rendered.

As much as possible is done to help make sure that the dApp is connected to a wallet/account
on the expected network while taking into account that the user may decide to switch network.

## Components

### [`WithWalletConnector`](./src/WithWalletConnector.ts)

Component that bridges [`@concordium/wallet-connectors`](../wallet-connectors) into a React context by
managing active connector, connection, connected account, network information, errors, etc. in its internal state.
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

Use `props.setActiveConnectorType(...)` and `props.connectActive()` from within `MyAppComponent`
to set up a connector and initiate a connection.

This is most easily done using [`useWalletConnectorSelector`](#usecontractselector).

Connector types for the Browser Wallet and WalletConnect connectors are usually initialized like so:

```typescript
export const BROWSER_WALLET = ephemeralConnectorType(BrowserWalletConnector.create);
export const WALLET_CONNECT = ephemeralConnectorType(WalletConnectConnector.create.bind(this, WALLET_CONNECT_OPTS));
```

See [the sample dApp](../../samples/contractupdate/src/Root.tsx) for a complete example.

## Hooks

### [`useWalletConnectorSelector`](./src/useWalletConnectorSelector.ts)

Hook for managing a connector selector; connecting/disconnecting when clicked and computing its selected/connected/disabled state.

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
