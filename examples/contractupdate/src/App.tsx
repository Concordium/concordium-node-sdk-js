import React, { useState } from 'react';
import { Col, Form, Row, Spinner } from 'react-bootstrap';
import { Network, WalletConnection } from '@concordium/react-components';
import { useContractSelector } from '@concordium/react-components';
import { ConcordiumGRPCClient } from '@concordium/web-sdk';
import { ContractDetails } from './ContractDetails';
import { ContractInvoker } from './ContractInvoker';

interface Props {
    network: Network;
    rpc: ConcordiumGRPCClient | undefined;
    connection: WalletConnection | undefined;
    connectedAccount: string | undefined;
}

export function App({ network, rpc, connection, connectedAccount }: Props) {
    const [input, setInput] = useState('');
    const contract = useContractSelector(rpc, input);
    return (
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
                        isInvalid={Boolean(contract.error)}
                        autoFocus
                    />
                    <Form.Control.Feedback type="invalid">{contract.error}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            {contract.isLoading && <Spinner animation="border" />}
            {contract.selected && rpc && (
                <>
                    <ContractDetails contract={contract.selected} />
                    <hr />
                    <ContractInvoker
                        rpc={rpc}
                        network={network}
                        connection={connection}
                        connectedAccount={connectedAccount}
                        contract={contract.selected}
                    />
                </>
            )}
        </>
    );
}
