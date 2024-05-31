import { WalletConnection, WalletConnector } from '@concordium/wallet-connectors';
import { useMemo, useState } from 'react';

import { errorString } from './error';

/**
 * The state of the a {@link useConnect} instance.
 */
export interface Connect {
    /**
     * Function for initiating a new connection using the provided connector or undefined if none was provided.
     * Any existing connection will not be automatically disconnected by calling the function.
     */
    connect: (() => void) | undefined;

    /**
     * Indicator on whether we're waiting for a connection to be established and approved.
     */
    isConnecting: boolean;

    /**
     * Error establishing the connection.
     */
    connectError: string;
}

/**
 * Hook that exposes a function for initiating a connection on the provided {@link connector} and,
 * if successful, store the resulting connection in {@link setConnection}.
 * The hook also exposes the status of the connection progress and an error if initiation failed.
 * @param connector The connector from which new connections are to be initiated.
 * @param setConnection The setter function to which new connections are passed.
 */
export function useConnect(
    connector: WalletConnector | undefined,
    setConnection: (c: WalletConnection) => void
): Connect {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState('');
    const connect = useMemo(() => {
        if (!connector) {
            // There's no connector to connect to.
            // Previously this would result in an exception being thrown by the returned function.
            // Now we return 'undefined' instead to indicate that it isn't ready to be called.
            return undefined;
        }
        return () => {
            setIsConnecting(true);
            connector
                .connect()
                .then((c) => {
                    if (c) {
                        setConnection(c);
                        setConnectError('');
                    }
                })
                .catch((e) => setConnectError(errorString(e)))
                .finally(() => setIsConnecting(false));
        };
    }, [connector, setConnection]);
    return { connect, isConnecting, connectError };
}
