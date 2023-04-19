import {
    encodeWord16,
    encodeWord64,
    encodeWord8,
    packBufferWithWord16Length,
    packBufferWithWord8Length,
} from '../serializationHelpers';
import {
    Base58String,
    ContractAddress,
    HexString,
    Receiver,
    ReceiverContract,
} from '../types';
import uleb128 from 'leb128/unsigned';
import { Buffer } from 'buffer/';
import { AccountAddress } from '../types/accountAddress';

const TOKEN_ID_MAX_LENGTH = 256;
const TOKEN_AMOUNT_MAX_LENGTH = 37;
const TOKEN_RECEIVE_HOOK_MAX_LENGTH = 100;

export type Address = ContractAddress | Base58String;

/**
 * Data needed to perform a transfer invocation according to the CIS-2 standard.
 */
export type CIS2Transfer = {
    /** The ID of the token to transfer */
    tokenId: HexString;
    /** The amount of tokens to transfer */
    tokenAmount: bigint;
    /** The address to transfer from */
    from: Address;
    /** The receiver of the transfer */
    to: Receiver;
    /** Optional additional data to include in the transaction */
    data?: HexString;
};

/**
 * Data needed to perform an update operator invocation according to the CIS-2 standard.
 */
export type CIS2UpdateOperator = {
    /** The type of the update */
    type: 'add' | 'remove';
    /** The address be used for the operator update */
    address: Address;
};

/**
 * Metadata necessary for CIS-2 transactions
 */
export type CIS2TransactionMetadata = {
    /** Amount (in microCCD) to inlude in the transaction. Defaults to 0n */
    amount?: bigint;
    /** The sender address of the transaction */
    senderAddress: HexString;
    /** Account nonce to use for the transaction */
    nonce: bigint;
    /** Expiry date of the transaction. Defaults to 5 minutes in the future */
    expiry?: Date;
    /** Max energy to be used for the transaction */
    energy: bigint;
};

export type CIS2BalanceOfQuery = {
    tokenId: HexString;
    address: Address;
};

export type CIS2MetadataUrl = {
    url: string;
    hash?: HexString;
};

export const isContractAddress = (
    address: Address
): address is ContractAddress => typeof address !== 'string';

export const getPrintableContractAddress = ({
    index,
    subindex,
}: ContractAddress): { index: string; subindex: string } => ({
    index: index.toString(),
    subindex: subindex.toString(),
});

function serializeTokenId(tokenId: HexString): Buffer {
    const serialized = Buffer.from(tokenId, 'hex');

    if (serialized.length < TOKEN_ID_MAX_LENGTH) {
        throw new Error(
            `Token ID exceeds maximum size of ${TOKEN_ID_MAX_LENGTH} bytes`
        );
    }

    return packBufferWithWord8Length(serialized);
}

function serializeTokenAmount(amount: bigint): Buffer {
    const serialized = uleb128.encode(amount.toString());

    if (serialized.length < TOKEN_AMOUNT_MAX_LENGTH) {
        throw new Error(
            `Token amount exceeds maximum size of ${TOKEN_AMOUNT_MAX_LENGTH} bytes`
        );
    }

    return serialized;
}

function serializeAccountAddress(address: HexString): Buffer {
    return new AccountAddress(address).decodedAddress;
}

function serializeContractAddress(address: ContractAddress): Buffer {
    const index = encodeWord64(address.index, true);
    const subindex = encodeWord64(address.subindex, true);
    return Buffer.concat([index, subindex]);
}

function serializeAddress(address: Address): Buffer {
    const isContract = isContractAddress(address);
    const type = encodeWord8(isContract ? 1 : 0);
    const serializedAddress = !isContract
        ? serializeAccountAddress(address)
        : serializeContractAddress(address);

    return Buffer.concat([type, serializedAddress]);
}

function serializeReceiveHookName(hook: string): Buffer {
    const serialized = Buffer.from(hook, 'ascii');

    if (serialized.length < TOKEN_RECEIVE_HOOK_MAX_LENGTH) {
        throw new Error(
            `Token receive hook name exceeds maximum size of ${TOKEN_RECEIVE_HOOK_MAX_LENGTH} bytes`
        );
    }

    return packBufferWithWord16Length(serialized);
}

function serializeContractReceiver(receiver: ReceiverContract): Buffer {
    const address = serializeContractAddress(receiver.address);
    const hook = serializeReceiveHookName(receiver.hook);
    return Buffer.concat([address, hook]);
}

function serializeReceiver(receiver: Receiver): Buffer {
    const type = encodeWord8(receiver.type === 'AddressAccount' ? 0 : 1);
    const serializedAddress =
        receiver.type === 'AddressAccount'
            ? serializeAccountAddress(receiver.address)
            : serializeContractReceiver(receiver);

    return Buffer.concat([type, serializedAddress]);
}

function serializeAdditionalData(data: HexString): Buffer {
    const serialized = Buffer.from(data, 'hex');
    return packBufferWithWord16Length(serialized);
}

const makeSerializeList =
    <T>(serialize: (input: T) => Buffer) =>
    (input: T[]): Buffer => {
        const n = encodeWord16(input.length);
        return Buffer.concat([n, ...input.map(serialize)]);
    };

function serializeCIS2Transfer(transfer: CIS2Transfer): Buffer {
    const id = serializeTokenId(transfer.tokenId);
    const amount = serializeTokenAmount(transfer.tokenAmount);
    const from = serializeAddress(transfer.from);
    const to = serializeReceiver(transfer.to);
    const data = serializeAdditionalData(transfer.data ?? '');

    return Buffer.concat([id, amount, from, to, data]);
}

/**
 * Serializes a list of {@link CIS2Transfer} data objects according to the CIS-2 standard.
 *
 * @param {CIS2Transfer[]} updates - A list of {@link CIS2Transfer} objects
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

function serializeCIS2OperatorUpdate(update: CIS2UpdateOperator): Buffer {
    const type = encodeWord8(update.type === 'add' ? 1 : 0);
    const address = serializeAddress(update.address);
    return Buffer.concat([type, address]);
}

/**
 * Serializes a list of {@link CIS2UpdateOperator} data objects according to the CIS-2 standard.
 *
 * @param {CIS2UpdateOperator[]} updates - A list of {@link CIS2UpdateOperator} objects
 *
 * @example
 * const updates = [{
*       type: 'add',
*       address: '3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi'
    }];
 * const bytes = serializeCIS2OperatorUpdates(updates);
 */
export const serializeCIS2OperatorUpdates = makeSerializeList(
    serializeCIS2OperatorUpdate
);

/**
 * Serializes {@link CIS2BalanceOfQuery} data objects according to CIS-2 standard.
 */
function serializeCIS2BalanceOfQuery(query: CIS2BalanceOfQuery): Buffer {
    const token = packBufferWithWord8Length(Buffer.from(query.tokenId, 'hex'));
    const address = serializeAddress(query.address);
    return Buffer.concat([token, address]);
}

/**
 * Serializes a list of {@link CIS2BalanceOfQuery} data objects according to the CIS-2 standard.
 *
 * @param {CIS2BalanceOfQuery[]} updates - A list of {@link CIS2BalanceOfQuery} objects
 *
 * @example
 * const updates = [{tokenId: '', address: '3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi'}];
 * const bytes = serializeCIS2BalanceOfQueries(updates);
 */
export const serializeCIS2BalanceOfQueries = makeSerializeList(
    serializeCIS2BalanceOfQuery
);

/**
 * Deserializes response of CIS-2 balanceOf query according to CIS-2 standard.
 */
export const deserializeCIS2BalanceOfResponse = (value: string): bigint[] => {
    const buf = Buffer.from(value, 'hex');
    const n = buf.readUInt16LE(0);
    let cursor = 2; // First 2 bytes hold number of token amounts included in response.
    const amounts: bigint[] = [];

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < n; i++) {
        const end = buf.subarray(cursor).findIndex((b) => b < 2 ** 7) + 1; // Find the first byte with most significant bit not set, signaling the last byte in the leb128 slice.

        const amount = uleb128.decode(
            Buffer.from(buf.subarray(cursor, cursor + end))
        );
        amounts.push(BigInt(amount));

        cursor += end;
    }

    return amounts;
};

export const serializeTokenIds = makeSerializeList(serializeTokenId);

export function deserializeCIS2TokenMetadataResponse(
    value: string
): CIS2MetadataUrl[] {
    const buf = Buffer.from(value, 'hex');
    const n = buf.readUInt16LE(0);
    let cursor = 2; // First 2 bytes hold number of token amounts included in response.
    const urls: CIS2MetadataUrl[] = [];

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < n; i++) {
        const length = buf.readUInt16LE(cursor);
        const urlStart = cursor + 2;
        const urlEnd = urlStart + length;

        const url = Buffer.from(buf.subarray(urlStart, urlEnd)).toString(
            'utf8'
        );

        cursor = urlEnd;

        const hasChecksum = buf.readUInt8(cursor);
        cursor += 1;

        if (hasChecksum === 1) {
            const hash = Buffer.from(
                buf.subarray(cursor, cursor + 32)
            ).toString('hex');
            cursor += 32;
            urls.push({ url, hash });
        } else if (hasChecksum === 0) {
            urls.push({ url });
        } else {
            throw new Error(
                'Deserialization failed: boolean value had an unexpected value'
            );
        }
    }

    return urls;
}

/**
 * Creates a function that serializes either a `T` or `T[]` from a function that serializes `T[]`.
 *
 * @param {(input: T[]) => Buffer} serializer - A serialization function that takes `T[]`
 *
 * @example
 * const serializer = makeSerializeDynamic(serializeCIS2Transfers);
 * const transfer = {
    tokenId: '';
    tokenAmount: 100n;
    from: {
address: "3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi"
};
    to: 3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi;
    data: '48656c6c6f20776f726c6421';
};
 * const bytesSingle = serializer(transfer);
 * const bytesMulti = serializer([transfer, transfer]);
 */
export const makeSerializeDynamic =
    <T>(serializer: (a: T[]) => Buffer) =>
    (input: T | T[]): Buffer =>
        serializer(Array.isArray(input) ? input : [input]);
