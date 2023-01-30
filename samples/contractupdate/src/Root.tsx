import React, { useEffect, useState } from 'react';
import { Alert, Col, Container, Row } from 'react-bootstrap';
import { withJsonRpcClient } from '@concordium/react-components';
import { WalletConnectionProps, WithWalletConnector } from '@concordium/react-components';
import { WalletConnectionButton } from './WalletConnectionButton';
import { WalletConnectorButton } from './WalletConnectorButton';
import { ConnectedAccount } from './ConnectedAccount';
import { App } from './App';
import { NetworkSelector } from './NetworkSelector';
import { BROWSER_WALLET, MAINNET, TESTNET, WALLET_CONNECT } from './config';
import { errorString } from './util';

export default function Root() {
    const [network, setNetwork] = useState(TESTNET);
    return (
        <Container>
            <h1>Sample dApp</h1>
            <NetworkSelector selected={network} options={[TESTNET, MAINNET]} select={setNetwork} />
            <WithWalletConnector network={network}>{(props) => <Main {...props} />}</WithWalletConnector>
        </Container>
    );
}

function Main(props: WalletConnectionProps) {
    const [rpcGenesisHash, setRpcGenesisHash] = useState<string>();
    const [rpcError, setRpcError] = useState('');

    const { activeConnection, activeConnectionGenesisHash, network } = props;
    useEffect(() => {
        if (activeConnection) {
            setRpcGenesisHash(undefined);
            withJsonRpcClient(activeConnection, async (rpc) => {
                const status = await rpc.getConsensusStatus();
                return status.genesisBlock;
            })
                .then((hash) => {
                    setRpcGenesisHash(hash);
                    setRpcError('');
                })
                .catch((err) => {
                    setRpcGenesisHash(undefined);
                    setRpcError(errorString(err));
                });
        }
    }, [activeConnection, activeConnectionGenesisHash, network]);

    return (
        <>
            <Row className="mt-3 mb-3">
                <Col>
                    <WalletConnectorButton connectorType={BROWSER_WALLET} connectorName="Browser Wallet" {...props} />
                </Col>
                <Col>
                    <WalletConnectorButton connectorType={WALLET_CONNECT} connectorName="WalletConnect" {...props} />
                </Col>
            </Row>
            <Row className="mt-3 mb-3">
                <Col>
                    <WalletConnectionButton {...props}>
                        <>
                            {props.isConnecting && 'Connecting...'}
                            {!props.isConnecting &&
                                props.activeConnectorType === BROWSER_WALLET &&
                                'Connect Browser Wallet'}
                            {!props.isConnecting &&
                                props.activeConnectorType === WALLET_CONNECT &&
                                'Connect Mobile Wallet'}
                        </>
                    </WalletConnectionButton>
                </Col>
            </Row>
            <Row className="mt-3 mb-3">
                <Col>
                    <ConnectedAccount {...props} />
                </Col>
            </Row>
            <Row className="mt-3 mb-3">
                <Col>
                    {props.activeConnectedAccount && (
                        <NetworkInconsistencyReporter
                            rpcGenesisHash={rpcGenesisHash}
                            networkGenesisHash={network.genesisHash}
                            activeConnectionGenesisHash={activeConnectionGenesisHash}
                        />
                    )}
                    {rpcError && <Alert variant="warning">RPC error: {rpcError}</Alert>}
                    <App
                        network={props.network}
                        connection={props.activeConnection}
                        connectedAccount={props.activeConnectedAccount}
                    />
                </Col>
            </Row>
        </>
    );
}

interface NetworkInconsistencyReporterProps {
    rpcGenesisHash: string | undefined;
    activeConnectionGenesisHash: string | undefined;
    networkGenesisHash: string;
}

function NetworkInconsistencyReporter({
    rpcGenesisHash,
    networkGenesisHash,
    activeConnectionGenesisHash,
}: NetworkInconsistencyReporterProps) {
    const rpcMismatch = rpcGenesisHash && rpcGenesisHash !== networkGenesisHash;
    const activeConnectionMismatch = activeConnectionGenesisHash && activeConnectionGenesisHash !== networkGenesisHash;
    return (
        <>
            {(rpcMismatch || activeConnectionMismatch) && (
                <Alert variant="danger">
                    Inconsistent network parameters detected!
                    <ul>
                        <li>
                            Reported by wallet:{' '}
                            {(activeConnectionGenesisHash && <code>{activeConnectionGenesisHash}</code>) || <i>N/A</i>}.
                        </li>
                        <li>Fetched from via RPC: {(rpcGenesisHash && <code>{rpcGenesisHash}</code>) || <i>N/A</i>}</li>
                        <li>
                            Expected for selected network: <code>{networkGenesisHash}</code>
                        </li>
                    </ul>
                </Alert>
            )}
        </>
    );
}
