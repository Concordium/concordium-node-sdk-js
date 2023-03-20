import React, { useCallback, useState } from 'react';
import { TESTNET } from './config';
import { useConnect, useConnection, WalletConnectionProps, WithWalletConnector } from '@concordium/react-components';
import { Alert, Button, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import { WalletConnectorButton } from './WalletConnectorButton';
import { BROWSER_WALLET, WALLET_CONNECT } from './config';
import { AccountTransactionSignature } from '@concordium/web-sdk';

export default function App() {
    return (
        <Container>
            <h1>Message Signer</h1>
            <WithWalletConnector network={TESTNET}>{(props) => <Main {...props} />}</WithWalletConnector>
        </Container>
    );
}

function Main(props: WalletConnectionProps) {
    const { activeConnectorType, activeConnector, activeConnectorError, connectedAccounts, genesisHashes } = props;
    const { connection, setConnection, account } = useConnection(connectedAccounts, genesisHashes);
    const { connect, isConnecting, connectError } = useConnect(activeConnector, setConnection);

    const [message, setMessage] = useState('');
    const [signature, setSignature] = useState<AccountTransactionSignature>('');
    const [error, setError] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);

    const handleInput = useCallback((e: any) => setMessage(e.target.value), []);
    const handleSubmit = useCallback(() => {
        if (connection && account && message) {
            setError('');
            setIsWaiting(true);
            connection
                .signMessage(account, message)
                .then((m) => setSignature(m))
                .catch((e) => setError((e as Error).message || e))
                .finally(() => setIsWaiting(false));
        }
    }, [connection, account, message]);
    return (
        <>
            <Row className="mt-3 mb-3">
                <Col>
                    <WalletConnectorButton
                        connectorType={BROWSER_WALLET}
                        connectorName="Browser Wallet"
                        connection={connection}
                        {...props}
                    />
                </Col>
                <Col>
                    <WalletConnectorButton
                        connectorType={WALLET_CONNECT}
                        connectorName="WalletConnect"
                        connection={connection}
                        {...props}
                    />
                </Col>
            </Row>
            <Row className="mt-3 mb-3">
                <Col>
                    {activeConnectorError && <Alert variant="danger">Connector error: {activeConnectorError}.</Alert>}
                    {!activeConnectorError && activeConnectorType && !activeConnector && <Spinner />}
                    {connectError && <Alert variant="danger">Connection error: {connectError}.</Alert>}
                    {activeConnector && !account && (
                        <Button type="button" onClick={connect} disabled={isConnecting}>
                            {isConnecting && 'Connecting...'}
                            {!isConnecting && activeConnectorType === BROWSER_WALLET && 'Connect Browser Wallet'}
                            {!isConnecting && activeConnectorType === WALLET_CONNECT && 'Connect Mobile Wallet'}
                        </Button>
                    )}
                </Col>
            </Row>
            {account && (
                <Row className="mt-3 mb-3">
                    <Col>
                        Connected to account <code>{account}</code>.
                    </Col>
                </Row>
            )}
            <Form.Group as={Row} className="mb-3" controlId="contract">
                <Form.Label column sm={3}>
                    Message to sign:
                </Form.Label>
                <Col sm={9}>
                    <InputGroup>
                        <Form.Control
                            type="text"
                            value={message}
                            onChange={handleInput}
                            disabled={!connection}
                            placeholder={connection ? undefined : 'Connect wallet to sign message'}
                            autoFocus
                        />
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={!connection || !message || isWaiting}
                        >
                            {isWaiting ? 'Signing...' : 'Sign'}
                        </Button>
                    </InputGroup>
                </Col>
            </Form.Group>
            <Row>
                {error && <Alert variant="danger"></Alert>}
                {signature && (
                    <>
                        <Col sm={3}>Signature:</Col>
                        <Col sm={9}>
                            <pre title={`Message: ${message}`}>{JSON.stringify(signature, null, 2)}</pre>
                        </Col>
                    </>
                )}
            </Row>
        </>
    );
}
