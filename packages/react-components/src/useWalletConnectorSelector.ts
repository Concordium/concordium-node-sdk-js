import { useCallback } from 'react';
import { ConnectorType, WalletConnectionProps } from './WithWalletConnector';

/**
 * The state of the a {@link useWalletConnectorSelector} instance.
 */
export interface WalletConnectorSelector {
    /**
     * Indicator of whether the selector is selected (i.e. it matches the active connector type).
     */
    isSelected: boolean;

    /**
     * Indicator of whether the selector is connected (i.e. it's selected and has an active connection).
     */
    isConnected: boolean;

    /**
     * Indicator of whether the selector is disabled (i.e. there is another connected selector).
     */
    isDisabled: boolean;

    /**
     * Handler function to be called when the selector is invoked.
     * It will disconnect all existing connections and set the active connector type to the one of this selector.
     * If the selector is already selected, it will reset the connector type to allow other connector types to be activated.
     * The function should not be called if the selector is disabled.
     */
    select: () => void;
}
/**
 * React hook for managing a connector selector (usually a button in the UI).
 * To maximize flexibility, the basic {@link WithWalletConnector} tries to add as few constraints as possible
 * on how the connectors are used.
 * To implement a common case, this hook adds the additional rule that only one connector can exist at any given time.
 * Connections not belonging to this connector are automatically disconnected.
 *
 * More precisely, the hook computes the derived state {@link WalletConnectorSelector} from {@link props} as follows:
 * - The selector is {@link WalletConnectorSelector.isSelected selected} if the active connector has type {@link connectorType}.
 * - The selector is {@link WalletConnectorSelector.isConnected connected} if it is selected and has an active connection.
 * - The selector is {@link WalletConnectorSelector.isDisabled disabled} if it there is another connected selector.
 *
 * It also exposes a {@link WalletConnectorSelector.select handler function} for connecting/disconnecting appropriately
 * when the selector is invoked.
 *
 * @param connectorType The connector type controlled by this selector.
 * @param props The props exposed by {@link WithWalletConnector} to its child component.
 * @return The resolved state.
 */
export function useWalletConnectorSelector(connectorType: ConnectorType, props: WalletConnectionProps): WalletConnectorSelector {
    const { disconnectActive, activeConnectorType, activeConnector, activeConnection, setActiveConnectorType } = props;
    const isSelected = activeConnectorType === connectorType;
    const select = useCallback(() => {
        disconnectActive();
        // TODO Use isSelected here and remove redundant values from the list of dependencies.
        setActiveConnectorType(activeConnectorType === connectorType ? undefined : connectorType);
    }, [connectorType, activeConnector, activeConnectorType]);
    const isConnected = Boolean(isSelected && activeConnection); // the hook's semantics ensures that activeConnection originates from this connector
    const isDisabled = Boolean(activeConnectorType && activeConnectorType !== connectorType && activeConnection);
    return { isSelected, isConnected, isDisabled, select };
}
