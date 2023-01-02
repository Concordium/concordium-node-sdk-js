import { WalletConnection } from 'concordium-dapp-wallet-connectors';
import { Col, Row, Form, Spinner } from 'react-bootstrap';
import { useContractSelector } from 'concordium-dapp-components-reactjs';
import { ContractDetails } from './ContractDetails';

interface Props {
    connection: WalletConnection | undefined;
}

export function App({ connection }: Props) {
    const contract = useContractSelector(connection?.getJsonRpcClient());
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
                                value={contract.input}
                                onChange={(e) => contract.setInput(e.currentTarget.value)}
                                isInvalid={Boolean(contract.validationError)}
                                autoFocus
                            />
                            <Form.Control.Feedback type="invalid">{contract.validationError}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                    {contract.isLoading && <Spinner animation="border" />}
                    {contract.selected && <ContractDetails contract={contract.selected} />}
                </>
            )}
        </>
    );
}
