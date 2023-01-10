import React from 'react';
import { Button } from 'react-bootstrap';

interface Props {
    connectorName: string;
    isSelected: boolean;
    isConnected: boolean;
    isDisabled: boolean;
    select: () => void;
}

export function WalletConnectorButton({ connectorName, isSelected, isConnected, isDisabled, select }: Props) {
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
