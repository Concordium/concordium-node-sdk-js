import React from 'react';
import { Button } from 'react-bootstrap';
import { ConnectorType, useWalletConnectorSelector, WalletConnectionProps } from '@concordium/react-components';

interface Props extends WalletConnectionProps {
    connectorType: ConnectorType;
    connectorName: string;
}

export function WalletConnectorButton(props: Props) {
    const { connectorType, connectorName } = props;
    const { isSelected, isConnected, isDisabled, select } = useWalletConnectorSelector(connectorType, props);

    const verb = isConnected ? 'Disconnect' : isSelected ? 'Using' : 'Use';
    return (
        <Button
            className="w-100"
            disabled={isDisabled}
            variant={isConnected ? 'danger' : isSelected ? 'dark' : 'light'}
            onClick={select}
        >
            {`${verb} ${connectorName}`}
        </Button>
    );
}
