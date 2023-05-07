import { useCallback, useState } from 'react';
import { WalletConnection, WalletConnector } from '@concordium/wallet-connectors';
import { errorString } from './error';

/**
 * The state of the a {@link useConnect} instance.
 */
export interface Connect {
    /**
     * Function for initiating a new connection. Any existing connection will not be automatically disconnected.
     */
    connect: () => void;

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
 * The hook also exposes the status of the connection progress and error if initiation failed.
 * @param connector The connector from which new connections are to be initiated.
 * @param setConnection The setter function to which new connections are passed.
 */
export function useConnect(
    connector: WalletConnector | undefined,
    setConnection: (c: WalletConnection) => void
): Connect {
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectError, setConnectError] = useState('');
    const connect = useCallback(() => {
        if (!connector) {
            throw new Error('no connector to connect from');
        }
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
    }, [connector, setConnection]);
    return { connect, isConnecting, connectError };
}
