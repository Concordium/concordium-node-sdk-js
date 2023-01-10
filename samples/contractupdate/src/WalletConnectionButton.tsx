import React from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { WalletConnectionProps } from '@concordium/react-components';

export function WalletConnectionButton({
    activeConnectorType,
    activeConnector,
    activeConnectorError,
    activeConnection,
    connectActive,
    isConnecting,
}: WalletConnectionProps) {
    return (
        <>
            {activeConnectorError && <Alert variant="danger">Error: {activeConnectorError}.</Alert>}
            {!activeConnectorError && activeConnectorType && !activeConnector && <Spinner />}
            {activeConnector && !activeConnection && (
                <Button type="button" onClick={connectActive} disabled={isConnecting}>
                    {isConnecting && 'Connecting...'}
                    {!isConnecting && activeConnectorType === 'BrowserWallet' && 'Connect Browser Wallet'}
                    {!isConnecting && activeConnectorType === 'WalletConnect' && 'Connect Mobile Wallet'}
                </Button>
            )}
        </>
    );
}
