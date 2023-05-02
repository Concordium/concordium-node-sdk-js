import {
    Info,
    moduleSchemaFromBase64,
    Network,
    parameterSchemaFromBase64,
    Schema,
    WalletConnection,
} from '@concordium/react-components';
import React, { ChangeEvent, Dispatch, useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Col, Dropdown, DropdownButton, Form, InputGroup, Row } from 'react-bootstrap';
import { AccountAddress, AccountTransactionType, CcdAmount, SchemaVersion } from '@concordium/web-sdk';
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

enum SchemaType {
    Parameter = 'Parameter',
    Module = 'Module (auto)',
    ModuleV2 = 'Module (v2)',
    ModuleV1 = 'Module (v1)',
    ModuleV0 = 'Module (v0)',
}

function schemaTypeFromSchema(schemaFromRpc: Schema | undefined, inputSchemaType: SchemaType) {
    if (!schemaFromRpc) {
        return inputSchemaType;
    }
    switch (schemaFromRpc.type) {
        case 'ModuleSchema':
            switch (schemaFromRpc.version) {
                case undefined:
                    return SchemaType.Module;
                case SchemaVersion.V0:
                    return SchemaType.ModuleV0;
                case SchemaVersion.V1:
                    return SchemaType.ModuleV1;
                case SchemaVersion.V2:
                    return SchemaType.ModuleV2;
                default:
                    throw new Error(`unexpected schema version "${schemaFromRpc.version}"`);
            }
        case 'ParameterSchema':
            return SchemaType.Parameter;
    }
}

const DEFAULT_SCHEMA_TYPE = SchemaType.Module;

function schemaOfType(type: SchemaType, schemaBase64: string): Schema {
    switch (type) {
        case SchemaType.Module:
            return moduleSchemaFromBase64(schemaBase64);
        case SchemaType.ModuleV0:
            return moduleSchemaFromBase64(schemaBase64, SchemaVersion.V0);
        case SchemaType.ModuleV1:
            return moduleSchemaFromBase64(schemaBase64, SchemaVersion.V1);
        case SchemaType.ModuleV2:
            return moduleSchemaFromBase64(schemaBase64, SchemaVersion.V2);
        case SchemaType.Parameter:
            return parameterSchemaFromBase64(schemaBase64);
        default:
            throw new Error(`unsupported schema type "${type}"`);
    }
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

    const [schemaTypeInput, setSchemaTypeInput] = useState<SchemaType>(DEFAULT_SCHEMA_TYPE);

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
            try {
                return ok({ fromRpc: false, schema: schemaOfType(schemaTypeInput, schemaInput) });
            } catch (e) {
                return err('schema is not valid base64');
            }
        }
        return (
            schemaRpcResult?.map((r) => ({ fromRpc: true, schema: r?.schema })) ||
            ok({ fromRpc: false, schema: undefined })
        );
    }, [schemaInput, schemaTypeInput, schemaRpcResult]);
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
                .asyncAndThen(([parameters, { schema }, amount]) =>
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
                            schema && { parameters, schema }
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
                        <InputGroup hasValidation={true}>
                            <Form.Control
                                value={schemaInput}
                                onChange={onSchemaChange}
                                isValid={schemaResult.match(
                                    ({ fromRpc }) => fromRpc,
                                    () => false
                                )}
                                isInvalid={schemaResult.isErr()}
                                placeholder={schemaRpcResult?.match(
                                    (v) => v && v.schema.value.toString('base64'),
                                    () => undefined
                                )}
                            />
                            <DropdownButton
                                title={schemaTypeFromSchema(
                                    schemaResult.match(
                                        ({ schema }) => schema,
                                        () => undefined
                                    ),
                                    schemaTypeInput
                                )}
                                disabled={schemaResult.match(
                                    ({ fromRpc, schema }) => fromRpc && Boolean(schema),
                                    () => false
                                )}
                            >
                                <Dropdown.Item onClick={() => setSchemaTypeInput(SchemaType.Parameter)}>
                                    Parameter schema
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => setSchemaTypeInput(SchemaType.Module)}>
                                    Module schema (auto)
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => setSchemaTypeInput(SchemaType.ModuleV2)}>
                                    Module schema (v2)
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => setSchemaTypeInput(SchemaType.ModuleV1)}>
                                    Module schema (v1)
                                </Dropdown.Item>
                                <Dropdown.Item onClick={() => setSchemaTypeInput(SchemaType.ModuleV0)}>
                                    Module schema (v0)
                                </Dropdown.Item>
                            </DropdownButton>
                            {schemaResult.match(
                                () =>
                                    schemaRpcResult?.match(
                                        (v) =>
                                            v && (
                                                <Form.Control.Feedback>
                                                    Using schema from section <code>{v.sectionName}</code> of the
                                                    contract's module.
                                                </Form.Control.Feedback>
                                            ),
                                        () => undefined
                                    ),
                                (e) => (
                                    <Form.Control.Feedback type="invalid">{e}</Form.Control.Feedback>
                                )
                            )}
                        </InputGroup>
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
