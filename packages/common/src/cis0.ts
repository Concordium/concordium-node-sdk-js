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

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS0 {
    export type StandardIdentifier = string;
    export enum SupportType {
        NoSupport,
        Support,
        SupportBy,
    }
    export type NoSupport = { type: SupportType.NoSupport };
    export type Support = { type: SupportType.Support };
    export type SupportBy = {
        type: SupportType.SupportBy;
        address: ContractAddress;
    };
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
        const type = buffer.readUInt8(0);
        let cursor = 1;

        if (type > 2) {
            throw new Error('Unsupported support result type');
        }

        let value: CIS0.SupportResult;
        if (type !== 2) {
            value = {
                type:
                    type === 0
                        ? CIS0.SupportType.NoSupport
                        : CIS0.SupportType.Support,
            };
        } else {
            const index = buffer.readBigUInt64LE(cursor) as bigint;
            cursor += 8;
            const subindex = buffer.readBigUInt64LE(cursor) as bigint;
            cursor += 8;

            value = {
                type: CIS0.SupportType.SupportBy,
                address: {
                    index,
                    subindex,
                },
            };
        }

        return { value, bytesRead: cursor };
    });

export function supports(
    grpcClient: ConcordiumNodeClient,
    contractAddress: ContractAddress,
    id: CIS0.StandardIdentifier,
    blockHash?: HexString
): Promise<CIS0.SupportResult>;
export function supports(
    grpcClient: ConcordiumNodeClient,
    contractAddress: ContractAddress,
    ids: CIS0.StandardIdentifier[],
    blockHash?: HexString
): Promise<CIS0.SupportResult[]>;
export async function supports(
    grpcClient: ConcordiumNodeClient,
    contractAddress: ContractAddress,
    ids: CIS0.StandardIdentifier | CIS0.StandardIdentifier[],
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
    const parameter = makeSerializeDynamic(serializeSupportIdentifiers)(ids);

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
    const isListInput = Array.isArray(ids);
    const expectedValuesLength = isListInput ? ids.length : 1;

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
