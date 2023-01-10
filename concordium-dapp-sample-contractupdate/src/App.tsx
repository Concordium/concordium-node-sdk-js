import { Network, WalletConnection } from 'concordium-dapp-wallet-connectors';
import { Col, Form, Row, Spinner } from 'react-bootstrap';
import { useContractSelector } from 'concordium-dapp-components-reactjs';
import { ContractDetails } from './ContractDetails';
import React, { useState } from 'react';
import { ContractInvoker } from './ContractInvoker';

interface Props {
    network: Network;
    connection: WalletConnection | undefined;
    connectedAccount: string | undefined;
}

export function App({ network, connection, connectedAccount }: Props) {
    const [input, setInput] = useState('');
    const contract = useContractSelector(connection?.getJsonRpcClient(), input);
    return (
        <>
            {connection && (
                <>
                    <Form.Group as={Row} className="mb-3" controlId="contract">
                        <Form.Label column sm={3}>
                            Contract index:
                        </Form.Label>
                        <Col sm={9}>
                            <Form.Control
                                type="text"
                                placeholder="Address (index)"
                                value={input}
                                onChange={(e) => setInput(e.currentTarget.value)}
                                isInvalid={Boolean(contract.validationError)}
                                autoFocus
                            />
                            <Form.Control.Feedback type="invalid">{contract.validationError}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    {contract.isLoading && <Spinner animation="border" />}
                    {contract.selected && (
                        <>
                            <ContractDetails contract={contract.selected} />
                            <hr />
                            <ContractInvoker
                                network={network}
                                connection={connection}
                                connectedAccount={connectedAccount}
                                contract={contract.selected}
                            />
                        </>
                    )}
                </>
            )}
        </>
    );
}
