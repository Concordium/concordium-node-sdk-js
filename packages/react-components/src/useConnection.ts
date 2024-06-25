import { WalletConnection } from '@concordium/wallet-connectors';
import { useEffect, useState } from 'react';

/**
 * The state of the a {@link useConnection} instance.
 */
export interface Connection {
    /**
     * The current connection.
     */
    connection: WalletConnection | undefined;

    /**
     * Function for setting or resetting {@link connection}.
     * @param connection The wallet connection.
     */
    setConnection: (connection: WalletConnection | undefined) => void;

    /**
     * The selected account of the connection.
     */
    account: string | undefined;

    /**
     * The hash of the genesis block for the chain that {@link account} lives on.
     */
    genesisHash: string | undefined;
}

/**
 * Hook for managing a connection and exposing its state.
 * The connection is automatically pruned from the state when it disconnects.
 * @param connectedAccounts Mapping from open connections to their selected accounts or the empty string if there isn't one.
 * @param genesisHashes Mapping from open connections to the hash of the genesis block for the chain that the selected accounts of the connections live on.
 */
export function useConnection(
    connectedAccounts: Map<WalletConnection, string | undefined>,
    genesisHashes: Map<WalletConnection, string | undefined>
): Connection {
    const [connection, setConnection] = useState<WalletConnection>();
    useEffect(() => {
        // Unset disconnected connection.
        if (connection && !connectedAccounts.has(connection)) {
            setConnection(undefined);
        }
    }, [connectedAccounts]);
    return {
        connection,
        setConnection,
        genesisHash: connection && genesisHashes.get(connection),
        account: connection && connectedAccounts.get(connection),
    };
}
