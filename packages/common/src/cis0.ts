import { Buffer } from 'buffer/';
import { ContractAddress, HexString } from './types';
import ConcordiumNodeClient from './GRPCClient';
import {
    encodeWord16,
    makeDeserializeListResponse,
    makeSerializeDynamic,
    packBufferWithWord8Length,
} from './serializationHelpers';
import { stringify } from 'json-bigint';

/** Namespace with types for CIS-0 standard contracts */
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS0 {
    /** Identifier to query for support, f.x. 'CIS-2' */
    export type StandardIdentifier = 'CIS-0' | 'CIS-1' | 'CIS-2' | string;
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
        address: ContractAddress;
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

const deserializeSupportResult =
    makeDeserializeListResponse<CIS0.SupportResult>((buffer: Buffer) => {
        const rawType = buffer.readUInt8(0);
        let cursor = 1;

        if (rawType > 2) {
            throw new Error('Unsupported support result type');
        }

        let value: CIS0.SupportResult;
        if (rawType !== 2) {
            const type =
                rawType === 0
                    ? CIS0.SupportType.NoSupport
                    : CIS0.SupportType.Support;
            value = { type };
        } else {
            const index = buffer.readBigUInt64LE(cursor) as bigint;
            cursor += 8;
            const subindex = buffer.readBigUInt64LE(cursor) as bigint;
            cursor += 8;

            value = {
                type: CIS0.SupportType.SupportBy,
                address: { index, subindex },
            };
        }

        return { value, bytesRead: cursor };
    });

/**
 * Queries a CIS-0 contract for support for a {@link CIS0.StandardIdentifier}.
 *
 * @param {ConcordiumNodeClient} grpcClient - The client to be used for the query.
 * @param {ContractAddress} contractAddress - The address of the contract to query.
 * @param {CIS0.StandardIdentifier} standardId - The standard identifier to query for support in contract.
 * @param {HexString} [blockHash] - The hash of the block to query at.
 *
 * @throws If the query could not be invoked successfully.
 *
 * @returns {CIS0.SupportResult} The support result of the query.
 */
export function cis0Supports(
    grpcClient: ConcordiumNodeClient,
    contractAddress: ContractAddress,
    standardId: CIS0.StandardIdentifier,
    blockHash?: HexString
): Promise<CIS0.SupportResult>;
/**
 * Queries a CIS-0 contract for support for a {@link CIS0.StandardIdentifier}.
 *
 * @param {ConcordiumNodeClient} grpcClient - The client to be used for the query.
 * @param {ContractAddress} contractAddress - The address of the contract to query.
 * @param {CIS0.StandardIdentifier[]} standardIds - The standard identifiers to query for support in contract.
 * @param {HexString} [blockHash] - The hash of the block to query at.
 *
 * @throws If the query could not be invoked successfully.
 *
 * @returns {CIS0.SupportResult[]} The support results of the query. These are ordered by the ID's supplied by the `ids` param.
 */
export function cis0Supports(
    grpcClient: ConcordiumNodeClient,
    contractAddress: ContractAddress,
    standardIds: CIS0.StandardIdentifier[],
    blockHash?: HexString
): Promise<CIS0.SupportResult[]>;
export async function cis0Supports(
    grpcClient: ConcordiumNodeClient,
    contractAddress: ContractAddress,
    standardIds: CIS0.StandardIdentifier | CIS0.StandardIdentifier[],
    blockHash?: HexString
): Promise<CIS0.SupportResult | CIS0.SupportResult[]> {
    const instanceInfo = await grpcClient.getInstanceInfo(contractAddress);

    if (instanceInfo === undefined) {
        throw new Error(
            `Could not get contract instance info for contract at address ${stringify(
                contractAddress
            )}`
        );
    }

    const contractName = instanceInfo.name.substring(5);

    if (!instanceInfo.methods.includes(`${contractName}.supports`)) {
        throw new Error(
            `Contract at address ${stringify(
                contractAddress
            )} does not support the CIS-0 standard.`
        );
    }

    const parameter = makeSerializeDynamic(serializeSupportIdentifiers)(
        standardIds
    );

    const response = await grpcClient.invokeContract(
        {
            contract: contractAddress,
            parameter,
            method: `${contractName}.supports`,
        },
        blockHash
    );

    if (
        response === undefined ||
        response.tag === 'failure' ||
        response.returnValue === undefined
    ) {
        throw new Error(
            `Failed to invoke support for contract at ${stringify(
                contractAddress
            )}${
                response.tag === 'failure' &&
                ` with error ${stringify(response.reason)}`
            }`
        );
    }
    const results = deserializeSupportResult(response.returnValue);
    const isListInput = Array.isArray(standardIds);
    const expectedValuesLength = isListInput ? standardIds.length : 1;

    if (results.length !== expectedValuesLength) {
        throw new Error(
            'Mismatch between length of queries in request and values in response.'
        );
    }

    if (isListInput) {
        return results;
    } else {
        return results[0];
    }
}
