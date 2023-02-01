import React, { useCallback, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';
import { WalletConnectionProps } from '@concordium/react-components';
import { setErrorString } from './util';

interface Props extends WalletConnectionProps {
    children: (isConnecting: boolean) => JSX.Element;
}

export function WalletConnectionButton({ activeConnector, activeConnection, setActiveConnection, children }: Props) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');
    const connect = useCallback(() => {
        if (activeConnector) {
            setIsConnecting(true);
            activeConnector
                .connect()
                .then((c) => {
                    setActiveConnection(c);
                    setError('');
                })
                .catch(setErrorString(setError))
                .finally(() => setIsConnecting(false));
        }
    }, [activeConnector, setActiveConnection]);
    return (
        <>
            {error && <Alert variant="danger">Error: {error}.</Alert>}
            {activeConnector && !activeConnection && (
                <Button type="button" onClick={connect} disabled={isConnecting}>
                    {children(isConnecting)}
                </Button>
            )}
        </>
    );
}
