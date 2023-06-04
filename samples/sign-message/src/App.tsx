import { ResultAsync, err, ok } from 'neverthrow';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Col, Container, Form, InputGroup, Row, Spinner } from 'react-bootstrap';
import {
    TESTNET,
    WalletConnectionProps,
    WithWalletConnector,
    binaryMessageFromHex,
    stringMessage,
    typeSchemaFromBase64,
    useConnect,
    useConnection,
} from '@concordium/react-components';
import { AccountTransactionSignature } from '@concordium/web-sdk';
import { WalletConnectorButton } from './WalletConnectorButton';
import { BROWSER_WALLET, WALLET_CONNECT } from './config';
import { errorString } from './util';

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

    const [messageInput, setMessageInput] = useState('');
    const [schemaInput, setSchemaInput] = useState('');

    const schemaResult = useMemo(() => {
        if (!schemaInput) {
            return undefined;
        }
        try {
            return ok(typeSchemaFromBase64(schemaInput));
        } catch (e) {
            return err(errorString(e));
        }
    }, [schemaInput]);

    const messageResult = useMemo(() => {
        if (!messageInput) {
            return undefined;
        }
        if (!schemaResult) {
            // Empty schema implies string message.
            return ok(stringMessage(messageInput));
        }
        try {
            // Map schema result to message with input.
            // Return undefined if schema result is an error to avoid double reporting it.
            return schemaResult.match(
                (s) => ok(binaryMessageFromHex(messageInput, s)),
                () => undefined
            );
        } catch (e) {
            return err(errorString(e));
        }
    }, [messageInput, schemaResult]);

    const [signature, setSignature] = useState<AccountTransactionSignature>('');
    const [error, setError] = useState('');
    const [isWaiting, setIsWaiting] = useState(false);

    const handleMessageInput = useCallback((e: any) => setMessageInput(e.target.value), []);
    const handleSchemaInput = useCallback((e: any) => setSchemaInput(e.target.value), []);
    const handleSubmit = useCallback(() => {
        if (connection && account && messageResult) {
            messageResult
                .asyncAndThen((msg) => {
                    setError('');
                    setIsWaiting(true);
                    return ResultAsync.fromPromise(connection.signMessage(account, msg), errorString);
                })
                .match(setSignature, setError)
                .finally(() => setIsWaiting(false));
        }
    }, [connection, account, messageResult]);
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
            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>
                    Schema (if binary):
                </Form.Label>
                <Col sm={9}>
                    <InputGroup hasValidation={schemaResult?.isErr()}>
                        <Form.Control
                            type="text"
                            value={schemaInput}
                            onChange={handleSchemaInput}
                            placeholder="Leave empty for string message"
                            isInvalid={schemaResult?.isErr()}
                            autoFocus
                        />
                        <InputGroup.Text>Base64</InputGroup.Text>
                        {schemaResult?.match(
                            () => undefined,
                            (e) => (
                                <Form.Control.Feedback type="invalid">{e}</Form.Control.Feedback>
                            )
                        )}
                    </InputGroup>
                </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>
                    Message to sign:
                </Form.Label>
                <Col sm={9}>
                    <InputGroup hasValidation={messageResult?.isErr()}>
                        <Form.Control
                            type="text"
                            value={messageInput}
                            onChange={handleMessageInput}
                            isInvalid={messageResult?.isErr()}
                            autoFocus
                        />
                        <InputGroup.Text>{schemaInput ? 'Hex' : 'String'}</InputGroup.Text>
                        {messageResult?.match(
                            () => undefined,
                            (e) => (
                                <Form.Control.Feedback type="invalid">{e}</Form.Control.Feedback>
                            )
                        )}
                    </InputGroup>
                </Col>
            </Form.Group>
            <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3} />
                <Col sm={9}>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={!connection || !messageInput || isWaiting || !messageResult?.isOk()}
                    >
                        {isWaiting ? 'Signing...' : schemaInput ? 'Sign binary message' : 'Sign string message'}
                    </Button>
                </Col>
            </Form.Group>
            <Row>
                {error && <Alert variant="danger">{error}</Alert>}
                {signature && (
                    <>
                        <Col sm={3}>Signature:</Col>
                        <Col sm={9}>
                            <pre title={`Message: ${messageInput}`}>{JSON.stringify(signature, null, 2)}</pre>
                        </Col>
                    </>
                )}
            </Row>
        </>
    );
}
