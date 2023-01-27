import React from 'react';
import { Alert, Button, Spinner } from 'react-bootstrap';
import { WalletConnectionProps } from '@concordium/react-components';

interface Props extends WalletConnectionProps {
    children: JSX.Element;
}

export function WalletConnectionButton({
    activeConnectorType,
    activeConnector,
    activeConnectorError,
    activeConnection,
    connectActive,
    isConnecting,
    children,
}: Props) {
    return (
        <>
            {activeConnectorError && <Alert variant="danger">Error: {activeConnectorError}.</Alert>}
            {!activeConnectorError && activeConnectorType && !activeConnector && <Spinner />}
            {activeConnector && !activeConnection && (
                <Button type="button" onClick={connectActive} disabled={isConnecting}>
                    {children}
                </Button>
            )}
        </>
    );
}
