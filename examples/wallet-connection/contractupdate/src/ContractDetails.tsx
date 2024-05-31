import { Info } from '@concordium/react-components';
import { Alert, Col, Row } from 'react-bootstrap';

interface Props {
    contract: Info;
}

export function ContractDetails({ contract }: Props) {
    return (
        <Alert variant="secondary">
            <Row>
                <Col sm={2}>Name:</Col>
                <Col sm={10}>
                    <code>{contract.name}</code>
                </Col>
            </Row>
            <Row>
                <Col sm={2}>Index:</Col>
                <Col sm={10}>
                    <code>{contract.index.toString()}</code>
                </Col>
            </Row>
            <Row>
                <Col sm={2}>Owner:</Col>
                <Col sm={10}>
                    <code>{contract.owner.address}</code>
                </Col>
            </Row>
            <Row>
                <Col sm={2}>Balance:</Col>
                <Col sm={10}>{contract.amount.microCcdAmount.toString()} μCCD</Col>
            </Row>
            <Row>
                <Col sm={2}>Methods:</Col>
                <Col sm={10}>{contract.methods.join(', ')}</Col>
            </Row>
            <Row>
                <Col sm={2}>Platform:</Col>
                <Col sm={10}>v{contract.version}</Col>
            </Row>
        </Alert>
    );
}
