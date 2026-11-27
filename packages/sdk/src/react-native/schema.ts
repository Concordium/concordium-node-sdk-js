import JSONbig from 'json-bigint';

import type { SchemaVersion, SmartContractTypeValues } from '../types.js';
import * as ContractName from '../types/ContractName.js';
import * as EntrypointName from '../types/EntrypointName.js';
import * as Parameter from '../types/ParameterValue.js';
import { asArrayBuffer, indexInRange, loadBindings } from './bindings.js';

type Bytes = ArrayBuffer | Uint8Array;
const parse = JSONbig({ alwaysParseAsBig: true, useNativeBigInt: true }).parse;

function moduleSchema(bytes: Bytes, contract: ContractName.Type, version?: number) {
    return {
        bytes: asArrayBuffer(bytes),
        contractName: ContractName.toString(contract),
        version: version === undefined ? undefined : indexInRange(version, 'schemaVersion', 255),
    };
}

export async function getInitContractParameterSchema(
    schema: Bytes,
    contract: ContractName.Type,
    version?: SchemaVersion
): Promise<Uint8Array> {
    const native = await loadBindings();
    return new Uint8Array(await native.getInitContractParameterSchema(moduleSchema(schema, contract, version)));
}

export async function getUpdateContractParameterSchema(
    schema: Bytes,
    contract: ContractName.Type,
    entrypoint: EntrypointName.Type,
    version?: SchemaVersion
): Promise<Uint8Array> {
    const native = await loadBindings();
    return new Uint8Array(
        await native.getReceiveContractParameterSchema(
            moduleSchema(schema, contract, version),
            EntrypointName.toString(entrypoint)
        )
    );
}

export async function displayTypeSchemaTemplate(schema: Bytes): Promise<string> {
    return (await loadBindings()).displayTypeSchemaTemplate(asArrayBuffer(schema));
}

export async function serializeTypeValue(value: unknown, schema: Bytes, verbose = false): Promise<Parameter.Type> {
    const native = await loadBindings();
    return Parameter.fromBuffer(
        await native.serializeTypeValue(asArrayBuffer(schema), JSONbig.stringify(value), verbose)
    );
}

export async function serializeInitContractParameters(
    contract: ContractName.Type,
    value: unknown,
    schema: Bytes,
    version?: SchemaVersion,
    verbose = false
): Promise<Parameter.Type> {
    const native = await loadBindings();
    return Parameter.fromBuffer(
        await native.serializeInitContractParameters(
            moduleSchema(schema, contract, version),
            JSONbig.stringify(value),
            verbose
        )
    );
}

export async function serializeUpdateContractParameters(
    contract: ContractName.Type,
    entrypoint: EntrypointName.Type,
    value: unknown,
    schema: Bytes,
    version?: SchemaVersion,
    verbose = false
): Promise<Parameter.Type> {
    const native = await loadBindings();
    return Parameter.fromBuffer(
        await native.serializeReceiveContractParameters(
            moduleSchema(schema, contract, version),
            EntrypointName.toString(entrypoint),
            JSONbig.stringify(value),
            verbose
        )
    );
}

export async function deserializeTypeValue(
    value: Bytes,
    schema: Bytes,
    verbose = false
): Promise<SmartContractTypeValues> {
    const native = await loadBindings();
    return parse(await native.deserializeTypeValue(asArrayBuffer(schema), asArrayBuffer(value), verbose));
}

export async function deserializeContractState(
    contract: ContractName.Type,
    schema: Bytes,
    state: Bytes,
    verbose = false
): Promise<SmartContractTypeValues> {
    const native = await loadBindings();
    return parse(await native.deserializeState(moduleSchema(schema, contract), asArrayBuffer(state), verbose));
}

export async function deserializeReceiveReturnValue(
    value: Bytes,
    schema: Bytes,
    contract: ContractName.Type,
    entrypoint: EntrypointName.Type,
    version?: number,
    verbose = false
): Promise<SmartContractTypeValues> {
    const native = await loadBindings();
    return parse(
        await native.deserializeReceiveReturnValue(
            moduleSchema(schema, contract, version),
            EntrypointName.toString(entrypoint),
            asArrayBuffer(value),
            verbose
        )
    );
}

export async function deserializeReceiveError(
    value: Bytes,
    schema: Bytes,
    contract: ContractName.Type,
    entrypoint: EntrypointName.Type,
    verbose = false
): Promise<SmartContractTypeValues> {
    const native = await loadBindings();
    return parse(
        await native.deserializeReceiveError(
            moduleSchema(schema, contract),
            EntrypointName.toString(entrypoint),
            asArrayBuffer(value),
            verbose
        )
    );
}

export async function deserializeInitError(
    value: Bytes,
    schema: Bytes,
    contract: ContractName.Type,
    verbose = false
): Promise<SmartContractTypeValues> {
    const native = await loadBindings();
    return parse(await native.deserializeInitError(moduleSchema(schema, contract), asArrayBuffer(value), verbose));
}
