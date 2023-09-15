import bs58check from 'bs58check';
import {
    encodeWord16,
    encodeWord64,
    encodeWord8,
    makeSerializeOptional,
    packBufferWithWord16Length,
    packBufferWithWord8Length,
} from '../serializationHelpers.js';
import type {
    Base58String,
    HexString,
    SmartContractTypeValues,
} from '../types.js';
import * as ContractAddress from '../types/ContractAddress.js';
import * as AccountAddress from '../types/AccountAddress.js';
import * as EntrypointName from '../types/EntrypointName.js';
import { Buffer } from 'buffer/index.js';
import {
    uleb128Decode,
    uleb128DecodeWithIndex,
    uleb128Encode,
} from '../uleb128.js';
import {
    ContractTransactionMetadata,
    ContractUpdateTransactionWithSchema,
    CreateContractTransactionMetadata,
} from '../GenericContract.js';
import {
    Cursor,
    makeDeserializeListResponse,
} from '../deserializationHelpers.js';

const TOKEN_ID_MAX_LENGTH = 255;
const TOKEN_AMOUNT_MAX_LENGTH = 37;
const TOKEN_RECEIVE_HOOK_MAX_LENGTH = 100;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS2 {
    /**
     * Union between `ContractAddress` and an account address `AccountAddress`.
     */
    export type Address = ContractAddress.Type | AccountAddress.Type;

    /**
     * A Token ID that uniquely identifies the CIS-2 Token
     */
    export type TokenId = HexString;

    /**
     * A Token Address, that contains both a Contract Address and the unique
     * CIS-2 Token ID.
     */
    export type TokenAddress = {
        contract: ContractAddress.Type;
        id: TokenId;
    };

    /**
     * A contract address along with the name of the hook to be triggered when receiving a CIS-2 transfer.
     */
    export type ContractReceiver = {
        /** Contract address to receive tokens */
        address: ContractAddress.Type;
        /** Name of the entrypoint to be called on receiver contract. This is only the name of the function, NOT including the contract name */
        hookName: EntrypointName.Type;
    };

    /**
     * Union between an account address represented by an `AccountAddress` and a `ContractReceiver`.
     */
    export type Receiver = AccountAddress.Type | ContractReceiver;

    /**
     * Data needed to perform a "transfer" invocation according to the CIS-2 standard.
     */
    export type Transfer = {
        /** The ID of the token to transfer */
        tokenId: HexString;
        /** The amount of tokens to transfer, cannot be negative. */
        tokenAmount: bigint;
        /** The address to transfer from */
        from: Address;
        /** The receiver of the transfer */
        to: Receiver;
        /** Optional additional data to include in the transaction */
        data?: HexString;
    };

    /**
     * Data needed to perform an "updateOperator" invocation according to the CIS-2 standard.
     */
    export type UpdateOperator = {
        /** The type of the update */
        type: 'add' | 'remove';
        /** The address be used for the operator update */
        address: Address;
    };

    /**
     * Metadata necessary for CIS-2 transactions
     */
    export type TransactionMetadata = ContractTransactionMetadata;

    /**
     * Metadata necessary for creating a {@link UpdateTransaction}
     */
    export type CreateTransactionMetadata = CreateContractTransactionMetadata;

    /**
     * Data needed for CIS-2 "balanceOf" query.
     */
    export type BalanceOfQuery = {
        /** The ID of the token to query */
        tokenId: HexString;
        /** The address to query balance for */
        address: Address;
    };

    /**
     * Structure for holding metadata URL response from "tokenMetadata" query.
     */
    export type MetadataUrl = {
        /** The URL of the metadata */
        url: string;
        /** An optional checksum for the URL */
        hash?: HexString;
    };

    /**
     * Data needed for CIS-2 "operatorOf" query.
     */
    export type OperatorOfQuery = {
        /** The owner address for the query */
        owner: Address;
        /** The address to check whether it is an operator of `owner` */
        address: Address;
    };

    /**
     * An update transaction without header. This is useful for sending through a wallet, which supplies the header information.
     */
    export type UpdateTransaction<J extends SmartContractTypeValues> =
        ContractUpdateTransactionWithSchema<J>;

    /**
     * Structure of a JSON-formatted address parameter.
     */
    export type AddressParamJson =
        | { Account: [Base58String] }
        | { Contract: [{ index: number; subindex: number }] };

    /**
     * Structure of JSON formatted receiver parameter
     */
    export type ReceiverParamJson =
        | { Account: [Base58String] }
        | { Contract: [{ index: number; subindex: number }, string] };

    /**
     * Structure of JSON formatted parameter used for CIS-2 "transfer" transactions
     */
    export type TransferParamJson = {
        token_id: HexString;
        amount: string;
        from: AddressParamJson;
        to: ReceiverParamJson;
        data: HexString;
    };

    /**
     * Structure of JSON formatted parameter used for CIS-2 "updateOperator" transactions
     */
    export type UpdateOperatorParamJson = {
        update:
            | { Add: Record<string, never> }
            | { Remove: Record<string, never> };
        operator: AddressParamJson;
    };
}

function serializeCIS2TokenId(tokenId: CIS2.TokenId): Buffer {
    const serialized = Buffer.from(tokenId, 'hex');

    if (serialized.length > TOKEN_ID_MAX_LENGTH) {
        throw new Error(
            `Token ID exceeds maximum size of ${TOKEN_ID_MAX_LENGTH} bytes`
        );
    }

    return packBufferWithWord8Length(serialized);
}

function deserializeCIS2TokenId(buffer: Buffer): CIS2.TokenId {
    if (buffer.length > TOKEN_ID_MAX_LENGTH) {
        throw Error(
            `Token ID exceeds maximum size of ${TOKEN_ID_MAX_LENGTH} bytes`
        );
    }
    return buffer.toString('hex');
}

function serializeTokenAmount(amount: bigint): Buffer {
    if (amount < 0) {
        throw new Error('Negative token amount is not allowed');
    }

    const serialized = uleb128Encode(amount);

    if (serialized.length > TOKEN_AMOUNT_MAX_LENGTH) {
        throw new Error(
            `Token amount exceeds maximum size of ${TOKEN_AMOUNT_MAX_LENGTH} bytes`
        );
    }

    return serialized;
}

function serializeAccountAddress(address: AccountAddress.Type): Uint8Array {
    return AccountAddress.toBuffer(address);
}

/**
 * Serializes {@link ContractAddress} into bytes compatible with smart contract parameter deserialization
 *
 * @param {ContractAddress} address - The address to serialize
 *
 * @returns {Buffer} the address serialized to bytes
 */
export function serializeContractAddress(
    address: ContractAddress.Type
): Uint8Array {
    const index = encodeWord64(address.index, true);
    const subindex = encodeWord64(address.subindex, true);
    return Buffer.concat([index, subindex]);
}

function serializeAddress(address: CIS2.Address): Buffer {
    return Buffer.concat(
        ContractAddress.isContractAddress(address)
            ? [encodeWord8(1), serializeContractAddress(address)]
            : [encodeWord8(0), serializeAccountAddress(address)]
    );
}

/**
 * Serializes {@link EntrypointName.Type} contract entrypoint into bytes, prefixed by a 2-byte length
 *
 * @param {EntrypointName.Type} hook - the entrypoint to serialize
 *
 * @returns {Uint8Array} the entrypoint serialized to bytes
 */
export function serializeReceiveHookName(
    hook: EntrypointName.Type
): Uint8Array {
    const serialized = Buffer.from(EntrypointName.toString(hook), 'ascii');

    if (serialized.length > TOKEN_RECEIVE_HOOK_MAX_LENGTH) {
        throw new Error(
            `Token receive hook name exceeds maximum size of ${TOKEN_RECEIVE_HOOK_MAX_LENGTH} bytes`
        );
    }

    return packBufferWithWord16Length(serialized, true);
}

function serializeContractReceiver(receiver: CIS2.ContractReceiver): Buffer {
    const address = serializeContractAddress(receiver.address);
    const hook = serializeReceiveHookName(receiver.hookName);
    return Buffer.concat([address, hook]);
}

function serializeReceiver(receiver: CIS2.Receiver): Buffer {
    return Buffer.concat(
        AccountAddress.isAccountAddress(receiver)
            ? [encodeWord8(0), AccountAddress.toBuffer(receiver)]
            : [encodeWord8(1), serializeContractReceiver(receiver)]
    );
}

function serializeAdditionalData(data: HexString): Buffer {
    const serialized = Buffer.from(data, 'hex');
    return packBufferWithWord16Length(serialized, true);
}

const makeSerializeList =
    <T>(serialize: (input: T) => Buffer) =>
    (input: T[]): Buffer => {
        const n = encodeWord16(input.length, true);
        return Buffer.concat([n, ...input.map(serialize)]);
    };

function serializeCIS2Transfer(transfer: CIS2.Transfer): Buffer {
    const id = serializeCIS2TokenId(transfer.tokenId);
    const amount = serializeTokenAmount(transfer.tokenAmount);
    const from = serializeAddress(transfer.from);
    const to = serializeReceiver(transfer.to);
    const data = serializeAdditionalData(transfer.data ?? '');

    return Buffer.concat([id, amount, from, to, data]);
}

/**
 * Serializes a list of {@link CIS2.Transfer} data objects according to the CIS-2 standard.
 *
 * @param {CIS2.Transfer[]} transfers - A list of {@link CIS2.Transfer} objects
 *
 * @example
 * const transfers = [{
    tokenId: '';
    tokenAmount: 100n;
    from: '3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi',
    to: '3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi',
    data: '48656c6c6f20776f726c6421';
}];
 * const bytes = serializeCIS2Transfers(transfers);
 */
export const serializeCIS2Transfers = makeSerializeList(serializeCIS2Transfer);

function serializeCIS2UpdateOperator(update: CIS2.UpdateOperator): Buffer {
    const type = encodeWord8(update.type === 'add' ? 1 : 0);
    const address = serializeAddress(update.address);
    return Buffer.concat([type, address]);
}

/**
 * Serializes a list of {@link CIS2.UpdateOperator} data objects according to the CIS-2 standard.
 *
 * @param {CIS2.UpdateOperator[]} updates - A list of {@link CIS2.UpdateOperator} objects
 *
 * @example
 * const updates = [{
*       type: 'add',
*       address: '3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi'
    }];
 * const bytes = serializeCIS2UpdateOperators(updates);
 */
export const serializeCIS2UpdateOperators = makeSerializeList(
    serializeCIS2UpdateOperator
);

/**
 * Serializes {@link CIS2BalanceOfQuery} data objects according to CIS-2 standard.
 */
function serializeCIS2BalanceOfQuery(query: CIS2.BalanceOfQuery): Buffer {
    const token = serializeCIS2TokenId(query.tokenId);
    const address = serializeAddress(query.address);
    return Buffer.concat([token, address]);
}

/**
 * Serializes a list of {@link CIS2.BalanceOfQuery} data objects according to the CIS-2 standard.
 *
 * @param {CIS2.BalanceOfQuery[]} queries - A list of {@link CIS2.BalanceOfQuery} objects
 *
 * @example
 * const queries = [{tokenId: '', address: '3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi'}];
 * const bytes = serializeCIS2BalanceOfQueries(queries);
 */
export const serializeCIS2BalanceOfQueries = makeSerializeList(
    serializeCIS2BalanceOfQuery
);

/**
 * Deserializes response of CIS-2 balanceOf query according to CIS-2 standard.
 *
 * @param {HexString} value - The hex string value to deserialize
 *
 * @returns {bigint[]} A list of token balances.
 */
export const deserializeCIS2BalanceOfResponse = makeDeserializeListResponse(
    (cursor) => {
        const end = cursor.remainingBytes.findIndex((b) => b < 2 ** 7) + 1; // Find the first byte with most significant bit not set, signaling the last byte in the leb128 slice.
        if (end === 0) {
            throw new Error('Could not find leb128 end');
        }

        const leb128Slice = cursor.read(end);
        if (leb128Slice.length > TOKEN_AMOUNT_MAX_LENGTH) {
            throw new Error(
                `Found token amount with size exceeding the maximum allowed of ${TOKEN_AMOUNT_MAX_LENGTH}`
            );
        }

        const value = uleb128Decode(Buffer.from(leb128Slice));
        return value;
    }
);

/**
 * Serializes a list of {@link HexString} token ID's according to the CIS-2 standard.
 *
 * @param {HexString[]} tokenIds - A list of {@link HexString} values
 *
 * @example
 * const tokenIds = ['', '01', 'e2'];
 * const bytes = serializeCIS2TokenIds(tokenIds);
 */
export const serializeCIS2TokenIds = makeSerializeList(serializeCIS2TokenId);

/**
 * Serializes {@link CIS2.MetadataUrl} metadata URL into bytes
 *
 * @param {CIS2.MetadataUrl} metadataUrl - the metadata URL to serialize
 *
 * @returns {Buffer} the metadata URL serialized to bytes
 */
export function serializeCIS2MetadataUrl({
    url,
    hash,
}: CIS2.MetadataUrl): Buffer {
    const bUrl = packBufferWithWord16Length(Buffer.from(url, 'utf8'), true);
    const bHash = makeSerializeOptional<HexString>((h) =>
        Buffer.from(h, 'hex')
    )(hash);

    return Buffer.concat([bUrl, bHash]);
}

/**
 * Attempts to deserialize some data into a {@link CIS2.MetadataUrl}
 *
 * @param {Cursor | HexString} value - the value to deserialize
 *
 * @throws if deserialization fails
 *
 * @returns {CIS2.MetadataUrl} the metadata URL
 */
export function deserializeCIS2MetadataUrl(
    value: Cursor | HexString
): CIS2.MetadataUrl {
    const cursor = typeof value === 'string' ? Cursor.fromHex(value) : value;
    const length = cursor.read(2).readUInt16LE(0);

    const url = cursor.read(length).toString('utf8');

    const hasChecksum = cursor.read(1).readUInt8(0);

    let metadataUrl: CIS2.MetadataUrl;
    if (hasChecksum === 1) {
        const hash = cursor.read(32).toString('hex');
        metadataUrl = { url, hash };
    } else if (hasChecksum === 0) {
        metadataUrl = { url };
    } else {
        throw new Error(
            'Deserialization failed: boolean value had an unexpected value'
        );
    }

    return metadataUrl;
}

/**
 * Deserializes response of CIS-2 tokenMetadata query according to CIS-2 standard.
 *
 * @param {HexString} value - The hex string value to deserialize
 *
 * @returns {CIS2MetadataUrl[]} A list of metadata URL objects.
 */
export const deserializeCIS2TokenMetadataResponse =
    makeDeserializeListResponse<CIS2.MetadataUrl>(deserializeCIS2MetadataUrl);

function serializeCIS2OperatorOfQuery(query: CIS2.OperatorOfQuery): Buffer {
    const owner = serializeAddress(query.owner);
    const address = serializeAddress(query.address);
    return Buffer.concat([owner, address]);
}

/**
 * Parses a token address from a Base58-string. Will throw if the Base58
 * encoding is not a valid token address.
 *
 * @param str A Base58 encoded token address
 * @returns A parsed token address
 */
export function tokenAddressFromBase58(str: Base58String): CIS2.TokenAddress {
    const bytes = new Buffer(bs58check.decode(str));

    const firstByte = bytes[0];
    const [index, i] = uleb128DecodeWithIndex(bytes, 1);
    const [subindex, j] = uleb128DecodeWithIndex(bytes, i);
    const tokenIdBytes = new Buffer(bytes.subarray(j));

    if (firstByte !== 2) {
        throw Error(
            'Invalid token address: The Base58Check version byte is expected to be 2'
        );
    }

    const contract = ContractAddress.create(index, subindex);

    const id = deserializeCIS2TokenId(tokenIdBytes);

    return {
        contract,
        id,
    };
}

/**
 * Returns the Base58-encoding of the given CIS2 Token Address.
 *
 * @param tokenAddress A token address to convert into the base58-string format
 * @returns The base58-formatted string
 */
export function tokenAddressToBase58(
    tokenAddress: CIS2.TokenAddress
): Base58String {
    const firstByte = Buffer.from('02', 'hex');
    const indexBytes = uleb128Encode(tokenAddress.contract.index);
    const subindexBytes = uleb128Encode(tokenAddress.contract.subindex);
    const tokenBytes = Buffer.from(tokenAddress.id, 'hex');
    const bytes = Buffer.concat([
        firstByte,
        indexBytes,
        subindexBytes,
        tokenBytes,
    ]);

    return bs58check.encode(bytes);
}

/**
 * Serializes a list of {@link CIS2.OperatorOfQuery} queries according to the CIS-2 standard.
 *
 * @param {CIS2.OperatorOfQuery[]} queries - A list of {@link CIS2.OperatorOfQuery} objects
 *
 * @example
 * const queries = [{owner: "3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi", address: {index: 123n, subindex: 0n}}];
 * const bytes = serializeCIS2OperatorOfQueries(tokenIds);
 */
export const serializeCIS2OperatorOfQueries = makeSerializeList(
    serializeCIS2OperatorOfQuery
);

/**
 * Deserializes response of CIS-2 operatorOf query according to CIS-2 standard.
 *
 * @param {HexString} value - The hex string value to deserialize
 *
 * @returns {boolean[]} A list of boolean values.
 */
export const deserializeCIS2OperatorOfResponse = makeDeserializeListResponse(
    (cursor) => {
        const value = Boolean(cursor.read(1).readUInt8(0));
        return value;
    }
);

/**
 * Format {@link CIS2.UpdateOperator} as JSON compatible with serialization wtih corresponding schema.
 */
export function formatCIS2UpdateOperator(
    input: CIS2.UpdateOperator
): CIS2.UpdateOperatorParamJson {
    return {
        update: input.type === 'add' ? { Add: {} } : { Remove: {} },
        operator: ContractAddress.isContractAddress(input.address)
            ? {
                  Contract: [
                      {
                          index: Number(input.address.index),
                          subindex: Number(input.address.subindex),
                      },
                  ],
              }
            : { Account: [AccountAddress.toBase58(input.address)] },
    };
}

/**
 * Format {@link CIS2.Transfer} as JSON compatible with serialization wtih corresponding schema.
 */
export function formatCIS2Transfer(
    input: CIS2.Transfer
): CIS2.TransferParamJson {
    const from: CIS2.AddressParamJson = ContractAddress.isContractAddress(
        input.from
    )
        ? {
              Contract: [
                  {
                      index: Number(input.from.index),
                      subindex: Number(input.from.subindex),
                  },
              ],
          }
        : { Account: [AccountAddress.toBase58(input.from)] };
    let to: CIS2.ReceiverParamJson;
    if (AccountAddress.isAccountAddress(input.to)) {
        to = { Account: [AccountAddress.toBase58(input.to)] };
    } else {
        to = {
            Contract: [
                {
                    index: Number(input.to.address.index),
                    subindex: Number(input.to.address.subindex),
                },
                EntrypointName.toString(input.to.hookName),
            ],
        };
    }
    return {
        token_id: input.tokenId,
        amount: input.tokenAmount.toString(),
        from,
        to,
        data: input.data ?? '',
    };
}
