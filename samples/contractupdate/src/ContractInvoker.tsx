import { Info } from '@concordium/react-components';
import isBase64 from 'is-base64';
import React, { ChangeEvent, Dispatch, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Dropdown, Form, Row } from 'react-bootstrap';
import { Network, WalletConnection } from '@concordium/react-components';
import { AccountAddress, AccountTransactionType, CcdAmount } from '@concordium/web-sdk';
import { err, ok, Result, ResultAsync } from 'neverthrow';
import { useContractSchemaRpc } from './useContractSchemaRpc';
import { errorString } from './util';

interface ContractParamEntry {
    name: string;
    value: string;
}

interface ContractInvokerProps {
    network: Network;
    connection: WalletConnection;
    connectedAccount: string | undefined;
    contract: Info;
}

function parseParamValue(v: string) {
    try {
        // Assume that value is an account if it successfully parses as one.
        return { Account: [new AccountAddress(v).address] };
    } catch (e) {
        // Value is not an account.
        return v;
    }
}

function ccdScanUrl(network: Network, txHash: string | undefined) {
    return `${network.ccdScanBaseUrl}/?dcount=1&dentity=transaction&dhash=${txHash}`;
}

export function ContractInvoker({ network, connection, connectedAccount, contract }: ContractInvokerProps) {
    const [selectedMethodIndex, setSelectedMethodIndex] = useState(0);
    const [schemaInput, setSchemaInput] = useState('');
    // Reset selected method and schema input on contract change.
    useEffect(() => {
        setSelectedMethodIndex(0);
        setSchemaInput('');
    }, [contract]);

    const schemaRpcResult = useContractSchemaRpc(connection, contract);

    const [contractParams, setContractParams] = useState<Array<ContractParamEntry>>([]);
    const [contractAmountInput, setContractAmountInput] = useState('');
    const onSchemaChange = useCallback((e: ChangeEvent<HTMLInputElement>) => setSchemaInput(e.target.value), []);
    const onAmountChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => setContractAmountInput(e.target.value),
        []
    );

    const contractParamsResult = useMemo(
        () => ok(Object.fromEntries(contractParams.map((p) => [p.name, parseParamValue(p.value)]))),
        [contractParams]
    );
    const schemaResult = useMemo(() => {
        let input = schemaInput.trim();
        if (input) {
            return isBase64(input) ? ok({ fromRpc: false, schema: input }) : err('schema must be valid base64');
        }
        return (
            schemaRpcResult?.map((r) => ({ fromRpc: true, schema: r ? r.schema : '' })) ||
            ok({ fromRpc: false, schema: '' })
        );
    }, [schemaInput, schemaRpcResult]);
    const amountResult = useMemo(() => {
        try {
            return ok(BigInt(Math.round(Number(contractAmountInput) * 1e6)));
        } catch (e) {
            return err('amount must be a number');
        }
    }, [contractAmountInput]);
    const inputResult = useMemo(
        () => Result.combine([contractParamsResult, schemaResult, amountResult]),
        [contractParamsResult, schemaResult, amountResult]
    );

    const [isAwaitingApproval, setIsAwaitingApproval] = useState(false);
    const [submittedTxHash, setSubmittedTxHash] = useState<Result<string, string>>();
    const submit = useCallback(() => {
        if (connectedAccount) {
            setIsAwaitingApproval(true);
            inputResult
                .asyncAndThen(([params, schema, amount]) =>
                    ResultAsync.fromPromise(
                        connection.signAndSendTransaction(
                            connectedAccount,
                            AccountTransactionType.Update,
                            {
                                amount: new CcdAmount(amount),
                                address: { index: contract.index, subindex: BigInt(0) },
                                receiveName: contract.methods[selectedMethodIndex],
                                maxContractExecutionEnergy: BigInt(30000),
                            },
                            params,
                            schema.schema
                        ),
                        errorString
                    )
                )
                .then((r) => {
                    setSubmittedTxHash(r);
                    setIsAwaitingApproval(false);
                });
        }
    }, [connection, connectedAccount, contract, selectedMethodIndex, inputResult]);
    return (
        <>
            <h4>Update Contract</h4>
            {schemaRpcResult?.match(
                () => undefined,
                (e) => (
                    <Alert variant="warning">
                        Error fetching contract schema from chain: <code>{e}</code>.
                    </Alert>
                )
            )}
            <Form>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={2}>
                        Method:
                    </Form.Label>
                    <Col sm={10}>
                        <ContractMethodSelector
                            contract={contract}
                            selectedMethodIndex={selectedMethodIndex}
                            setSelectedMethodIndex={setSelectedMethodIndex}
                        />
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={2}>
                        Schema (base64):
                    </Form.Label>
                    <Col sm={10}>
                        <Form.Control
                            value={schemaInput}
                            onChange={onSchemaChange}
                            isValid={schemaResult.match(
                                ({ fromRpc }) => fromRpc,
                                () => false
                            )}
                            isInvalid={schemaResult.isErr()}
                            placeholder={schemaRpcResult?.match(
                                (v) => v && v.schema,
                                () => undefined
                            )}
                        />
                        {schemaResult.match(
                            () =>
                                schemaRpcResult?.match(
                                    (v) =>
                                        v && (
                                            <Form.Control.Feedback>
                                                Using schema from section <code>{v.sectionName}</code> of the contract's
                                                module.
                                            </Form.Control.Feedback>
                                        ),
                                    () => undefined
                                ),
                            (e) => (
                                <Form.Control.Feedback type="invalid">{e}</Form.Control.Feedback>
                            )
                        )}
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={2}>
                        Parameters:
                    </Form.Label>
                    <Col sm={10}>
                        <ContractParamInputs
                            contract={contract}
                            contractParams={contractParams}
                            setContractParams={setContractParams}
                        />
                        <div className="mt-2">As JSON:</div>
                        {contractParamsResult.match(
                            (r) => (
                                <pre>
                                    <code>{JSON.stringify(r, null, 2)}</code>
                                </pre>
                            ),
                            (e) => (
                                <Alert variant="danger">
                                    Parameter error: <code>{e}</code>.
                                </Alert>
                            )
                        )}
                    </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm={2}>
                        Amount (CCD):
                    </Form.Label>
                    <Col sm={10}>
                        <Form.Control
                            value={contractAmountInput}
                            onChange={onAmountChange}
                            isInvalid={amountResult.isErr()}
                        />
                        {amountResult.match(
                            () => undefined,
                            (e) => (
                                <Form.Control.Feedback type="invalid">{e}</Form.Control.Feedback>
                            )
                        )}
                    </Col>
                </Form.Group>
                <Row>
                    <Col>
                        <Button onClick={submit} disabled={isAwaitingApproval || inputResult.isErr()}>
                            {isAwaitingApproval && 'Waiting for approval...'}
                            {!isAwaitingApproval && 'Submit'}
                        </Button>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        {submittedTxHash?.match(
                            (txHash) => (
                                <>
                                    Submitted transaction:{' '}
                                    <a target="_blank" rel="noreferrer" href={ccdScanUrl(network, txHash)}>
                                        <code>{txHash}</code>
                                    </a>
                                </>
                            ),
                            (err) => (
                                <Alert variant="danger">
                                    Error submitting transaction: <code>{err}</code>.
                                </Alert>
                            )
                        )}
                    </Col>
                </Row>
            </Form>
        </>
    );
}

interface ContractParamInputsProps {
    contract: Info;
    contractParams: Array<ContractParamEntry>;
    setContractParams: Dispatch<Array<ContractParamEntry>>;
}

function ContractParamInputs({ contractParams, setContractParams }: ContractParamInputsProps) {
    const addContractParam = useCallback(() => {
        setContractParams([...contractParams, { name: '', value: '' }]);
    }, [contractParams, setContractParams]);
    return (
        <>
            {contractParams.map((p, i) => (
                <Row key={i}>
                    <ContractParamInput
                        key={i}
                        index={i}
                        contractParams={contractParams}
                        setContractParams={setContractParams}
                    />
                </Row>
            ))}
            <Button onClick={addContractParam}>+</Button>
        </>
    );
}

interface ContractParamInputProps {
    index: number;
    contractParams: Array<ContractParamEntry>;
    setContractParams: Dispatch<Array<ContractParamEntry>>;
}

function ContractParamInput({ index, contractParams, setContractParams }: ContractParamInputProps) {
    const setParamName = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setContractParams(contractParams.map((p, i) => (i === index ? { ...p, name: e.target.value } : p)));
        },
        [index, contractParams, setContractParams]
    );
    const setParamValue = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            setContractParams(contractParams.map((p, i) => (i === index ? { ...p, value: e.target.value } : p)));
        },
        [index, contractParams, setContractParams]
    );
    const remove = useCallback(() => {
        setContractParams(contractParams.filter((_, i) => i !== index));
    }, [index, contractParams, setContractParams]);
    return (
        <>
            <Col sm={4}>
                <Form.Group as={Row}>
                    <Form.Label>
                        Name
                        <Form.Control value={contractParams[index].name} onChange={setParamName} />
                    </Form.Label>
                </Form.Group>
            </Col>
            <Col sm={7}>
                <Form.Group as={Row}>
                    <Form.Label>
                        Value
                        <Form.Control value={contractParams[index].value} onChange={setParamValue} />
                    </Form.Label>
                </Form.Group>
            </Col>
            <Col sm={1}>
                <Button variant="danger" onClick={remove}>
                    x
                </Button>
            </Col>
        </>
    );
}

interface ContractMethodSelectorProps {
    contract: Info;
    selectedMethodIndex: number;
    setSelectedMethodIndex: React.Dispatch<number>;
}

function ContractMethodSelector({
    contract,
    selectedMethodIndex,
    setSelectedMethodIndex,
}: ContractMethodSelectorProps) {
    const onSelect = useCallback((key: any) => setSelectedMethodIndex(key as number), [setSelectedMethodIndex]);
    return (
        <Dropdown onSelect={onSelect}>
            <Dropdown.Toggle variant="outline-success">Method: {contract.methods[selectedMethodIndex]}</Dropdown.Toggle>
            <Dropdown.Menu>
                {contract.methods.map((m, idx) => (
                    <Dropdown.Item key={idx} eventKey={idx}>
                        {m}
                    </Dropdown.Item>
                ))}
            </Dropdown.Menu>
        </Dropdown>
    );
}
