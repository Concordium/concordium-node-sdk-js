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

export type CIS2Transfer = {
    tokenId: HexString;
    tokenAmount: bigint;
    from: Address;
    to: Receiver;
    data: HexString;
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

function serializeCIS2Transfer(transfer: CIS2Transfer): Buffer {
    const id = serializeTokenId(transfer.tokenId);
    const amount = serializeTokenAmount(transfer.tokenAmount);
    const from = serializeAddress(transfer.from);
    const to = serializeReceiver(transfer.to);
    const data = serializeAdditionalData(transfer.data);

    return Buffer.concat([id, amount, from, to, data]);
}

export function serializeCIS2Transfers(transfers: CIS2Transfer[]): Buffer {
    const n = encodeWord16(transfers.length);
    return Buffer.concat([n, ...transfers.map(serializeCIS2Transfer)]);
}
