import React, { useCallback, useState } from 'react';
import { Alert, Button, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import {
    TESTNET,
    WalletConnectionProps,
    WithWalletConnector,
    useConnect,
    useConnection,
} from '@concordium/react-components';
import {
    AttributeKeyString,
    MIN_DATE,
    VerifiablePresentation,
    Web3StatementBuilder,
    getPastDate,
} from '@concordium/web-sdk';
import { WalletConnectorButton } from './WalletConnectorButton';
import { BROWSER_WALLET, WALLET_CONNECT } from './config';

export default function App() {
    return (
        <Container>
            <h1>Identity proofs</h1>
            <WithWalletConnector network={TESTNET}>{(props) => <Main {...props} />}</WithWalletConnector>
        </Container>
    );
}

function Main(props: WalletConnectionProps) {
    const { activeConnectorType, activeConnector, activeConnectorError, connectedAccounts, genesisHashes } = props;
    const { connection, setConnection, account } = useConnection(connectedAccounts, genesisHashes);
    const { connect, isConnecting, connectError } = useConnect(activeConnector, setConnection);

    const [verifiablePresentation, setVerifiablePresentation] = useState<VerifiablePresentation>();
    const [error, setError] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);

    const handleSubmit = useCallback(() => {
        setVerifiablePresentation(undefined);
        setError('');
        setIsWaiting(true);

        const statementBuilder = new Web3StatementBuilder().addForIdentityCredentials([0, 1, 2, 3, 4, 5], (b) =>
            b.addRange(AttributeKeyString.dob, MIN_DATE, getPastDate(18, 1))
        );
        const statement = statementBuilder.getStatements();
        // In a production scenario the challenge should not be hardcoded, in order to avoid accepting proofs created for other contexts.
        const challenge = 'beefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeefbeef';

        connection
            ?.requestVerifiablePresentation(challenge, statement)
            .then((res) => setVerifiablePresentation(res))
            .catch((e: Error) => setError(`Failed to get verifiable presentation: ${e.message}`))
            .finally(() => setIsWaiting(false));
    }, [connection]);

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
                    {connect && !account && (
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
            <Form.Group as={Row} className="mb-3">
                <Col sm={3}>
                    <Button variant="primary" onClick={handleSubmit} disabled={!connection || isWaiting}>
                        {isWaiting ? 'Waiting for proof...' : 'Request proof'}
                    </Button>
                </Col>
            </Form.Group>
            {error && <Alert variant="danger">{error}</Alert>}
            {verifiablePresentation && (
                <Card>
                    <Card.Header>Verifiable presentation</Card.Header>
                    <Card.Body>
                        <Card.Text>{verifiablePresentation.toString()}</Card.Text>
                    </Card.Body>
                </Card>
            )}
        </>
    );
}
