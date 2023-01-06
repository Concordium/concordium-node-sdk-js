import React, { useEffect, useState } from 'react';
import { Alert, Col, Container, Row } from 'react-bootstrap';
import { Network, withJsonRpcClient } from 'concordium-dapp-wallet-connectors';
import { SignClientTypes } from '@walletconnect/types';
import {
    useWalletConnectorSelector,
    WalletConnectionProps,
    WithWalletConnector,
} from 'concordium-dapp-components-reactjs';
import { WalletConnectionButton } from './WalletConnectionButton';
import { WalletConnectorButton } from './WalletConnectorButton';
import { ConnectedAccount } from './ConnectedAccount';
import { App } from './App';
import { NetworkSelector } from './NetworkSelector';

export const TESTNET_GENESIS_BLOCK_HASH = '4221332d34e1694168c2a0c0b3fd0f273809612cb13d000d5c2e00e85f50f796';
export const MAINNET_GENESIS_BLOCK_HASH = '9dd9ca4d19e9393877d2c44b70f89acbfc0883c2243e5eeaecc0d1cd0503f478';
export const WALLET_CONNECT_PROJECT_ID = '76324905a70fe5c388bab46d3e0564dc';

const testnet: Network = {
    name: 'testnet',
    genesisHash: TESTNET_GENESIS_BLOCK_HASH,
    jsonRpcUrl: 'https://json-rpc.testnet.concordium.com',
    ccdScanBaseUrl: 'https://testnet.ccdscan.io',
};
const mainnet: Network = {
    name: 'mainnet',
    genesisHash: MAINNET_GENESIS_BLOCK_HASH,
    jsonRpcUrl: 'https://json-rpc.mainnet.concordium.software',
    ccdScanBaseUrl: 'https://ccdscan.io',
};
const networks = [testnet, mainnet];

const walletConnectOpts: SignClientTypes.Options = {
    projectId: WALLET_CONNECT_PROJECT_ID,
    metadata: {
        name: 'Contract Update',
        description: 'Example dApp for the performing an update on a contract.',
        url: '#',
        icons: ['https://walletconnect.com/walletconnect-logo.png'],
    },
};

export default function Root() {
    const [network, setNetwork] = useState(testnet);
    return (
        <Container>
            <h1>Sample dApp</h1>
            <NetworkSelector selected={network} options={networks} select={setNetwork} />
            <WithWalletConnector walletConnectOpts={walletConnectOpts} network={network}>
                {(props) => <Main {...props} />}
            </WithWalletConnector>
        </Container>
    );
}

function Main(props: WalletConnectionProps) {
    const browserWalletSelector = useWalletConnectorSelector('BrowserWallet', props);
    const walletConnectSelector = useWalletConnectorSelector('WalletConnect', props);

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
                    setRpcError((err as Error).message);
                });
        }
    }, [activeConnection, activeConnectionGenesisHash, network]);

    return (
        <>
            <Row className="mt-3 mb-3">
                <Col>
                    <WalletConnectorButton connectorName="Browser Wallet" {...browserWalletSelector} />
                </Col>
                <Col>
                    <WalletConnectorButton connectorName="Wallet Connect" {...walletConnectSelector} />
                </Col>
            </Row>
            <Row className="mt-3 mb-3">
                <Col>
                    <WalletConnectionButton {...props} />
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
                    <App network={props.network} connection={props.activeConnection} connectedAccount={props.activeConnectedAccount} />
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
