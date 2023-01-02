import { useCallback } from 'react';
import { ConnectorType, WalletConnectionProps } from './WithWalletConnector';

export function useWalletConnectorSelector(
    connectorType: ConnectorType,
    {
        disconnectActive,
        activeConnectorType,
        activeConnector,
        activeConnection,
        setActiveConnectorType,
    }: WalletConnectionProps
) {
    const select = useCallback(() => {
        disconnectActive();
        setActiveConnectorType(activeConnectorType === connectorType ? undefined : connectorType);
    }, [connectorType, activeConnector, activeConnectorType]);
    const isSelected = activeConnectorType === connectorType;
    const isConnected = Boolean(activeConnectorType === connectorType && activeConnection);
    const isDisabled = Boolean(activeConnectorType && activeConnectorType !== connectorType && activeConnection);
    return { isSelected, isConnected, isDisabled, select };
}
