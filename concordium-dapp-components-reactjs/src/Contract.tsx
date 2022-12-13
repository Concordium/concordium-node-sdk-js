import React, { useEffect, useState } from 'react';
import {AccountAddress, CcdAmount, JsonRpcClient, toBuffer} from '@concordium/web-sdk';
import { Result, ResultAsync } from 'neverthrow';
import { resultFromTruthy } from './util';
import {Buffer} from "buffer/";
import {decodeByte} from "./buffer";
import {microCcdToCcdString} from "./amount";

// <TMP>
import { Alert, Button, Col, Form, Modal, Row, Spinner } from 'react-bootstrap';
export async function refreshPiggybankState(rpc: JsonRpcClient, contract: Info) {
    console.debug(`Refreshing piggybank state for contract ${contract.index.toString()}`);
    const { version, name, index, methods } = contract;

    const expectedMethods = ['insert', 'smash', 'view'].map((m) => `${name}.${m}`);
    if (!expectedMethods.every(methods.includes.bind(methods))) {
        throw new Error(
            `contract "${name}" is not a piggy bank as it lacks at least one of the expected methods (${expectedMethods.join(', ')})`
        );
    }

    const method = `${name}.view`;
    const result = await rpc.invokeContract({ contract: { index, subindex: BigInt(0) }, method });
    if (!result) {
        throw new Error(`invocation of method "${method}" on contract "${index}" returned no result`);
    }
    switch (result.tag) {
        case 'failure': {
            throw new Error(
                `invocation of method "${method}" on v${version} contract "${index}" failed: ${JSON.stringify(
                    result.reason
                )}`
            );
        }
        case 'success': {
            const buffer = toBuffer(result.returnValue || '', 'hex');
            return decodePiggybankState(buffer, contract, new Date());
        }
        default: {
            throw new Error('unexpected result tag');
        }
    }
}
export function decodePiggybankState(buffer: Buffer, contract: Info, queryTime: Date): State {
    const [state] = decodeByte(buffer, 0);
    return {
        contract,
        isSmashed: Boolean(state),
        amount: microCcdToCcdString(contract.amount.microCcdAmount),
        ownerAddress: contract.owner.address,
        queryTime,
    };
}
export interface State {
    contract: Info;
    isSmashed: boolean;
    amount: string;
    ownerAddress: string;
    queryTime: Date;
}
// </TMP>

export interface Info {
    version: number;
    index: bigint;
    name: string;
    amount: CcdAmount;
    owner: AccountAddress;
    methods: string[];
}

interface Props {
    children: React.ReactNode;
    rpc: JsonRpcClient;
    setContract: React.Dispatch<Info | undefined>;
}

export async function refresh(rpc: JsonRpcClient, index: bigint) {
    console.debug(`Refreshing info for contract ${index.toString()}`);
    const info = await rpc.getInstanceInfo({ index, subindex: BigInt(0) });
    if (!info) {
        throw new Error(`contract ${index} not found`);
    }

    const { version, name, owner, amount, methods } = info;
    const prefix = 'init_';
    if (!name.startsWith(prefix)) {
        throw new Error(`name "${name}" doesn't start with "init_"`);
    }
    return { version, index, name: name.substring(prefix.length), amount, owner, methods };
}

const parseContractIndex = Result.fromThrowable(BigInt, () => 'invalid contract index');

export function ContractSelector(props: Props) {
    const { children, rpc, setContract } = props;
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState<string>();

    useEffect(() => {
        setIsLoading(true);
        resultFromTruthy(input, undefined)
            .andThen(parseContractIndex)
            .asyncAndThen((index) => ResultAsync.fromPromise(refresh(rpc, index), (e) => (e as Error).message))
            .match<[Info?, string?]>(
                (c) => [c, undefined],
                (e) => [undefined, e]
            )
            .then(([c, e]) => {
                setContract(c);
                setValidationError(e);
                setIsLoading(false);
            });
    }, [rpc, input, setContract]);

    return (
        <>
            <Row>
                <Col>
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
                                isInvalid={Boolean(validationError)}
                                autoFocus
                            />
                            <Form.Control.Feedback type="invalid">{validationError}</Form.Control.Feedback>
                        </Col>
                    </Form.Group>
                </Col>
            </Row>
            <Row>
                <Col>
                    {isLoading && <Spinner animation="border" />}
                    {children}
                </Col>
            </Row>
        </>
    );
}

interface ModalProps {
    rpc: JsonRpcClient;
    contract: Info | undefined;
    setContract: React.Dispatch<Info | undefined>;
}

export function ContractManager(props: ModalProps) {
    const { rpc, contract, setContract } = props;

    const [show, setShow] = useState(false);
    const [currentContract, setCurrentContract] = useState<Info>();
    const [currentPiggybankState, setCurrentPiggybankState] = useState<Result<State, string>>();
    useEffect(() => {
        resultFromTruthy(currentContract, 'no contract selected')
            .asyncAndThen((c) => ResultAsync.fromPromise(refreshPiggybankState(rpc, c), (e) => (e as Error).message))
            .then(setCurrentPiggybankState);
    }, [rpc, currentContract]);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const handleSelect = () => {
        setContract(currentContract);
        handleClose();
    };
    const canSelect = Boolean(currentPiggybankState?.isOk());

    return (
        <>
            <Button variant="outline-dark" size="sm" onClick={handleShow}>
                {!contract && 'Select contract'}
                {contract && (
                    <span>
                        Using&nbsp;contract&nbsp;<code>{contract.index.toString()}</code>
                    </span>
                )}
            </Button>
            <Modal show={show} onHide={handleClose} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Select contract</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <ContractSelector rpc={rpc} setContract={setCurrentContract}>
                        {currentContract && (
                            <>
                                <Alert variant="secondary">
                                    <Row>
                                        <Col sm={2}>Name:</Col>
                                        <Col sm={10}>
                                            <code>{currentContract.name}</code>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col sm={2}>Index:</Col>
                                        <Col sm={10}>
                                            <code>{currentContract.index.toString()}</code>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col sm={2}>Owner:</Col>
                                        <Col sm={10}>
                                            <code>{currentContract.owner.address}</code>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col sm={2}>Balance:</Col>
                                        <Col sm={10}>{currentContract.amount.microCcdAmount.toString()} μCCD</Col>
                                    </Row>
                                    <Row>
                                        <Col sm={2}>Methods:</Col>
                                        <Col sm={10}>{currentContract.methods.join(', ')}</Col>
                                    </Row>
                                    <Row>
                                        <Col sm={2}>Platform:</Col>
                                        <Col sm={10}>v{currentContract.version}</Col>
                                    </Row>
                                </Alert>
                                {!currentPiggybankState && <Spinner animation="border" />}
                                {currentPiggybankState?.match(
                                    ({ isSmashed, amount }) => (
                                        <Alert variant="success">
                                            Piggybank has {amount} CCD in it and is{' '}
                                            {isSmashed ? 'smashed' : 'not smashed'}.
                                        </Alert>
                                    ),
                                    (e) => (
                                        <Alert variant="danger">{e}</Alert>
                                    )
                                )}
                            </>
                        )}
                    </ContractSelector>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleSelect} disabled={!canSelect}>
                        Select
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}
