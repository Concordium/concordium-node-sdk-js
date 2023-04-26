import {
    encodeWord16,
    encodeWord64,
    encodeWord8,
    makeDeserializeListResponse,
    packBufferWithWord16Length,
    packBufferWithWord8Length,
} from '../serializationHelpers';
import {
    AccountTransactionType,
    Base58String,
    Base64String,
    ContractAddress,
    HexString,
    UpdateContractPayload,
} from '../types';
import uleb128 from 'leb128/unsigned';
import { Buffer } from 'buffer/';
import { AccountAddress } from '../types/accountAddress';

const TOKEN_ID_MAX_LENGTH = 256;
const TOKEN_AMOUNT_MAX_LENGTH = 37;
const TOKEN_RECEIVE_HOOK_MAX_LENGTH = 100;

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace CIS2 {
    /**
     * Union between `ContractAddress` and an account address represented by a `Base58String`.
     */
    export type Address = ContractAddress | Base58String;

    /**
     * A contract address along with the name of the hook to be triggered when receiving a CIS-2 transfer.
     */
    export type ContractReceiver = {
        /** Contract address to receive tokens */
        address: ContractAddress;
        /** Name of the entrypoint to be called on receiver contract. This is only the name of the function, NOT including the contract name */
        hookName: string;
    };

    /**
     * Union between an account address represented by a `Base58String` and a `ContractReceiver`.
     */
    export type Receiver = Base58String | ContractReceiver;

    /**
     * Data needed to perform a "transfer" invocation according to the CIS-2 standard.
     */
    export type Transfer = {
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
    export type TransactionMetadata = {
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

    /**
     * Metadata necessary for creating a {@link UpdateTransaction}
     */
    export type CreateTransactionMetadata = Pick<
        TransactionMetadata,
        'amount' | 'energy'
    >;

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
     * Structure for holding metadata URL reponse from tokenMetadata query.
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
    export type UpdateTransaction = {
        /** The type of the transaction, which will always be of type {@link AccountTransactionType.Update} */
        type: AccountTransactionType.Update;
        /** The payload of the transaction, which will always be of type {@link UpdateContractPayload} */
        payload: UpdateContractPayload;
        parameter: {
            /** Hex encoded parameter for the update */
            hex: HexString;
            /** JSON representation of the parameter to be used with the corresponding contract schema */
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            json: any;
        };
        schema: {
            /** Base64 encoded schema for the parameter type */
            value: Base64String;
            /** Type of the schema. This is always of type "parameter" */
            type: 'parameter';
        };
    };

    /**
     * A function processing a {@link UpdateTransaction}
     */
    export type ProcessTransactionFunction<R> = (
        transaction: UpdateTransaction
    ) => R;

    export type AddressParamJson =
        | { Account: [Base58String] }
        | { Contract: [{ index: number; subindex: number }] };
    export type ReceiveParamJson =
        | { Account: [Base58String] }
        | { Contract: [{ index: number; subindex: number }, string] };

    export type TransferParamJson = {
        token_id: HexString;
        amount: string;
        from: AddressParamJson;
        to: ReceiveParamJson;
        data: HexString;
    };

    export type UpdateOperatorParamJson = {
        update:
            | { Add: Record<string, never> }
            | { Remove: Record<string, never> };
        operator: AddressParamJson;
    };
}

/**
 * Checks whether an `Address` is a `ContractAddress`
 */
export const isContractAddress = (
    address: CIS2.Address
): address is ContractAddress => typeof address !== 'string';

function serializeCIS2TokenId(tokenId: HexString): Buffer {
    const serialized = Buffer.from(tokenId, 'hex');

    if (serialized.length > TOKEN_ID_MAX_LENGTH) {
        throw new Error(
            `Token ID exceeds maximum size of ${TOKEN_ID_MAX_LENGTH} bytes`
        );
    }

    return packBufferWithWord8Length(serialized);
}

function serializeTokenAmount(amount: bigint): Buffer {
    const serialized = uleb128.encode(amount.toString());

    if (serialized.length > TOKEN_AMOUNT_MAX_LENGTH) {
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

function serializeAddress(address: CIS2.Address): Buffer {
    const isContract = isContractAddress(address);
    const type = encodeWord8(isContract ? 1 : 0);
    const serializedAddress = !isContract
        ? serializeAccountAddress(address)
        : serializeContractAddress(address);

    return Buffer.concat([type, serializedAddress]);
}

function serializeReceiveHookName(hook: string): Buffer {
    const serialized = Buffer.from(hook, 'ascii');

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
    const isAccount = typeof receiver === 'string';
    const type = encodeWord8(isAccount ? 0 : 1);
    const serializedAddress = isAccount
        ? serializeAccountAddress(receiver)
        : serializeContractReceiver(receiver);

    return Buffer.concat([type, serializedAddress]);
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

function serializeCIS2OperatorUpdate(update: CIS2.UpdateOperator): Buffer {
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
 * const bytes = serializeCIS2OperatorUpdates(updates);
 */
export const serializeCIS2OperatorUpdates = makeSerializeList(
    serializeCIS2OperatorUpdate
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
    (buf) => {
        const end = buf.subarray(0).findIndex((b) => b < 2 ** 7) + 1; // Find the first byte with most significant bit not set, signaling the last byte in the leb128 slice.
        const amount = uleb128.decode(Buffer.from(buf.subarray(0, end)));
        return { value: BigInt(amount), bytesRead: end };
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
 * Deserializes response of CIS-2 tokenMetadata query according to CIS-2 standard.
 *
 * @param {HexString} value - The hex string value to deserialize
 *
 * @returns {CIS2MetadataUrl[]} A list of metadata URL objects.
 */
export const deserializeCIS2TokenMetadataResponse =
    makeDeserializeListResponse<CIS2.MetadataUrl>((buf) => {
        const length = buf.readUInt16LE(0);
        const urlStart = 2;
        const urlEnd = urlStart + length;

        const url = Buffer.from(buf.subarray(urlStart, urlEnd)).toString(
            'utf8'
        );

        let cursor = urlEnd;

        const hasChecksum = buf.readUInt8(cursor);
        cursor += 1;

        let metadataUrl: CIS2.MetadataUrl;
        if (hasChecksum === 1) {
            const hash = Buffer.from(
                buf.subarray(cursor, cursor + 32)
            ).toString('hex');
            cursor += 32;
            metadataUrl = { url, hash };
        } else if (hasChecksum === 0) {
            metadataUrl = { url };
        } else {
            throw new Error(
                'Deserialization failed: boolean value had an unexpected value'
            );
        }

        return { value: metadataUrl, bytesRead: cursor };
    });

function serializeCIS2OperatorOfQuery(query: CIS2.OperatorOfQuery): Buffer {
    const owner = serializeAddress(query.owner);
    const address = serializeAddress(query.address);
    return Buffer.concat([owner, address]);
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
    (buf) => {
        const value = Boolean(buf.readUInt8(0));
        return { value, bytesRead: 1 };
    }
);

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const formatCIS2UpdateOperator = (
    input: CIS2.UpdateOperator
): CIS2.UpdateOperatorParamJson => ({
    update: input.type === 'add' ? { Add: {} } : { Remove: {} },
    operator: isContractAddress(input.address)
        ? {
              Contract: [
                  {
                      index: Number(input.address.index),
                      subindex: Number(input.address.subindex),
                  },
              ],
          }
        : { Account: [input.address] },
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const formatCIS2Transfer = (
    input: CIS2.Transfer
): CIS2.TransferParamJson => {
    const from: CIS2.AddressParamJson = isContractAddress(input.from)
        ? {
              Contract: [
                  {
                      index: Number(input.from.index),
                      subindex: Number(input.from.subindex),
                  },
              ],
          }
        : { Account: [input.from] };
    let to: CIS2.ReceiveParamJson;
    if (typeof input.to === 'string') {
        to = { Account: [input.to] };
    } else {
        to = {
            Contract: [
                {
                    index: Number(input.to.address.index),
                    subindex: Number(input.to.address.subindex),
                },
                input.to.hookName,
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
};
