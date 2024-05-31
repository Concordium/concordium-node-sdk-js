import { Buffer } from 'buffer/index.js';
import { stringify } from 'json-bigint';

import { makeDeserializeListResponse } from './deserializationHelpers.js';
import { ConcordiumGRPCClient } from './grpc/GRPCClient.js';
import { encodeWord16, packBufferWithWord8Length } from './serializationHelpers.js';
import * as BlockHash from './types/BlockHash.js';
import * as ContractAddress from './types/ContractAddress.js';
import * as ContractName from './types/ContractName.js';
import * as EntrypointName from './types/EntrypointName.js';
import * as Parameter from './types/Parameter.js';
import * as ReceiveName from './types/ReceiveName.js';
import * as ReturnValue from './types/ReturnValue.js';
import { makeDynamicFunction } from './util.js';

/**
 * Namespace with types for CIS-0 standard contracts
 */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS0 {
    /** Identifier to query for support, f.x. 'CIS-2' */
    export type StandardIdentifier = 'CIS-0' | 'CIS-1' | 'CIS-2' | 'CIS-3' | string;
    /** Possible response types for a query */
    export enum SupportType {
        /** The standard is not supported */
        NoSupport,
        /** The standard is supported */
        Support,
        /** The standard is supported by another contract */
        SupportBy,
    }
    type SupportResponse<T extends SupportType> = {
        /** The {@link SupportType} of the support response */
        type: T;
    };
    /** The standard is not supported */
    export type NoSupport = SupportResponse<SupportType.NoSupport>;
    /** The standard is supported */
    export type Support = SupportResponse<SupportType.Support>;
    /** The standard is supported by another contract located at `address` */
    export type SupportBy = SupportResponse<SupportType.SupportBy> & {
        /** The address supporting the standard queried */
        addresses: ContractAddress.Type[];
    };
    /** Union of the different possible support query results. */
    export type SupportResult = NoSupport | Support | SupportBy;
}

function serializeSupportIdentifier(id: CIS0.StandardIdentifier): Buffer {
    const buf = Buffer.from(id, 'ascii');
    return packBufferWithWord8Length(buf);
}

function serializeSupportIdentifiers(ids: CIS0.StandardIdentifier[]): Buffer {
    const n = encodeWord16(ids.length, true);
    return Buffer.concat([n, ...ids.map(serializeSupportIdentifier)]);
}

const deserializeSupportResult = makeDeserializeListResponse<CIS0.SupportResult>((cursor) => {
    const type = cursor.read(1).readUInt8(0);

    if (type > 2) {
        throw new Error('Unsupported support result type');
    }

    if (type !== CIS0.SupportType.SupportBy) {
        return { type };
    }

    const numAddresses = cursor.read(1).readUInt8(0);
    const addresses: ContractAddress.Type[] = [];

    for (let i = 0; i < numAddresses; i++) {
        const index = cursor.read(8).readBigUInt64LE(0).valueOf();
        const subindex = cursor.read(8).readBigUInt64LE(0).valueOf();
        addresses.push(ContractAddress.create(index, subindex));
    }

    return {
        type,
        addresses,
    };
});

/**
 * Queries a CIS-0 contract for support for a {@link CIS0.StandardIdentifier}.
 *
 * @param {ConcordiumGRPCClient} grpcClient - The client to be used for the query.
 * @param {ContractAddress.Type} contractAddress - The address of the contract to query.
 * @param {CIS0.StandardIdentifier} standardId - The standard identifier to query for support in contract.
 * @param {BlockHash.Type} [blockHash] - The hash of the block to query at.
 *
 * @throws If the query could not be invoked successfully.
 *
 * @returns {CIS0.SupportResult} The support result of the query, or `undefined` if the contract does not support CIS-0.
 */
export function cis0Supports(
    grpcClient: ConcordiumGRPCClient,
    contractAddress: ContractAddress.Type,
    standardId: CIS0.StandardIdentifier,
    blockHash?: BlockHash.Type
): Promise<CIS0.SupportResult | undefined>;
/**
 * Queries a CIS-0 contract for support for a {@link CIS0.StandardIdentifier}.
 *
 * @param {ConcordiumGRPCClient} grpcClient - The client to be used for the query.
 * @param {ContractAddress.Type} contractAddress - The address of the contract to query.
 * @param {CIS0.StandardIdentifier[]} standardIds - The standard identifiers to query for support in contract.
 * @param {BlockHash.Type} [blockHash] - The hash of the block to query at.
 *
 * @throws If the query could not be invoked successfully.
 *
 * @returns {CIS0.SupportResult[]} The support results of the query ordered by the ID's supplied by the `ids` param, or `undefined` if the contract does not support CIS-0.
 */
export function cis0Supports(
    grpcClient: ConcordiumGRPCClient,
    contractAddress: ContractAddress.Type,
    standardIds: CIS0.StandardIdentifier[],
    blockHash?: BlockHash.Type
): Promise<CIS0.SupportResult[] | undefined>;
export async function cis0Supports(
    grpcClient: ConcordiumGRPCClient,
    contractAddress: ContractAddress.Type,
    standardIds: CIS0.StandardIdentifier | CIS0.StandardIdentifier[],
    blockHash?: BlockHash.Type
): Promise<CIS0.SupportResult | CIS0.SupportResult[] | undefined> {
    const instanceInfo = await grpcClient.getInstanceInfo(contractAddress).catch((e) => {
        throw new Error(
            `Could not get contract instance info for contract at address ${stringify(
                contractAddress
            )}: ${e.message ?? e}`
        );
    });

    const contractName = ContractName.fromInitName(instanceInfo.name);
    const supportReceiveName = ReceiveName.create(contractName, EntrypointName.fromStringUnchecked('supports'));

    if (!instanceInfo.methods.some((methods) => ReceiveName.equals(methods, supportReceiveName))) {
        return undefined;
    }

    const parameter = Parameter.fromBuffer(makeDynamicFunction(serializeSupportIdentifiers)(standardIds));

    const response = await grpcClient.invokeContract(
        {
            contract: contractAddress,
            parameter,
            method: supportReceiveName,
        },
        blockHash
    );

    if (response === undefined || response.tag === 'failure' || response.returnValue === undefined) {
        throw new Error(
            `Failed to invoke support for contract at ${stringify(contractAddress)}${
                response.tag === 'failure' && ` with error ${stringify(response.reason)}`
            }`
        );
    }
    const results = deserializeSupportResult(ReturnValue.toHexString(response.returnValue));
    const isListInput = Array.isArray(standardIds);
    const expectedValuesLength = isListInput ? standardIds.length : 1;

    if (results.length !== expectedValuesLength) {
        throw new Error('Mismatch between length of queries in request and values in response.');
    }

    if (isListInput) {
        return results;
    } else {
        return results[0];
    }
}
