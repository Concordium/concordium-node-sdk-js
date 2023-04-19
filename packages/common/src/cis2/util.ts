import {
    encodeWord16,
    encodeWord64,
    encodeWord8,
    packBufferWithWord16Length,
    packBufferWithWord8Length,
} from '../serializationHelpers';
import {
    Address,
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
    /** Amount (in microCCD) to inlude in the transaction */
    amont: bigint;
    /** The sender address of the transaction */
    senderAddress: HexString;
    /** Account nonce to use for the transaction */
    nonce: bigint;
    /** Expiry date of the transaction */
    expiry: Date;
    /** Max energy to be used for the transaction */
    energy: bigint;
};

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
    const type = encodeWord8(address.type === 'AddressAccount' ? 0 : 1);
    const serializedAddress =
        address.type === 'AddressAccount'
            ? serializeAccountAddress(address.address)
            : serializeContractAddress(address.address);

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
    from: 3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi;
    to: 3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi;
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
 * const updates = [{type: 'add', address: "3nsRkrtQVMRtD2Wvm88gEDi6UtqdUVvRN3oGZ1RqNJ3eto8owi"}];
 * const bytes = serializeCIS2OperatorUpdates(updates);
 */
export const serializeCIS2OperatorUpdates = makeSerializeList(
    serializeCIS2OperatorUpdate
);
