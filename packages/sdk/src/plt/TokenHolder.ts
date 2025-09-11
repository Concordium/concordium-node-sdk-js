import type * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import type {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for docs
    Unknown,
    Upward,
} from '../grpc/index.js';
import { Base58String } from '../index.js';
import { AccountAddress } from '../types/index.js';

interface TokenHolder<T extends string> {
    /** The type of the token holder. */
    type: T;
}

type TokenHolderAccountJSON = TokenHolder<'account'> & {
    /** The address of the token holder account. */
    address: Base58String;
};

class TokenHolderAccount implements TokenHolder<'account'> {
    public readonly type = 'account';

    constructor(
        /** The address of the account holding the token. */
        public readonly address: AccountAddress.Type
    ) {}

    public toString(): string {
        return this.address.toString();
    }

    /**
     * Get a JSON-serializable representation of the token holder account. This is called implicitly when serialized with JSON.stringify.
     * @returns {TokenHolderAccountJSON} The JSON representation.
     */
    public toJSON(): TokenHolderAccountJSON {
        return {
            type: 'account',
            address: this.address.toJSON(),
        };
    }
}

/** Describes the `Account` variant of a `TokenHolder`. */
export type Account = TokenHolderAccount;
/** Describes the `Account` variant of a `TokenHolder.JSON`. */
export type AccountJSON = TokenHolderAccountJSON;

/** Describes any variant of a `TokenHolder`. */
export type Type = Account; // Can be extended to include other token holder types in the future
/** Describes the JSON representation of variant of any `TokenHolder`. */
export type JSON = AccountJSON; // Can be extended to include other token holder types in the future

export function fromAccountAddress(address: AccountAddress.Type): TokenHolderAccount {
    return new TokenHolderAccount(address);
}

/**
 * Recreate a token holder {@link Account} from its JSON form.
 */
export function fromJSON(json: AccountJSON): Account;
/**
 * Recreate a {@link Type} from its JSON form.
 * If the `type` field is unknown, {@linkcode Unknown} is returned.
 */
export function fromJSON(json: JSON): Upward<Type>;
export function fromJSON(json: JSON): Upward<Type> {
    switch (json.type) {
        case 'account':
            return new TokenHolderAccount(AccountAddress.fromJSON(json.address));
        default:
            return null;
    }
}

/**
 * Construct a {@linkcode Account} from a base58check string.
 *
 * @param {string} address String of base58check encoded account address, must use a byte version of 1.
 * @returns {Account} The token holder account.
 * @throws If the provided string is not: exactly 50 characters, a valid base58check encoding using version byte 1.
 */
export function fromBase58(address: string): Account {
    return fromAccountAddress(AccountAddress.fromBase58(address));
}

/**
 * Get a base58check string of the token holder account address.
 * @param {Account} accountAddress The token holder account.
 */
export function toBase58(accountAddress: Account): string {
    return accountAddress.address.address;
}

/**
 * Type predicate which checks if a value is an instance of {@linkcode Type}
 */
export function instanceOf(value: unknown): value is Account {
    return value instanceof TokenHolderAccount;
}

/**
 * Convert token holder from its protobuf encoding.
 * @param {Proto.TokenHolder} tokenHolder the token holder
 * @returns {Type} The token holder.
 * @throws {Error} If the token holder type is unsupported.
 */
export function fromProto(tokenHolder: Proto.TokenHolder): Upward<Type> {
    switch (tokenHolder.address.oneofKind) {
        case 'account':
            return fromAccountAddress(AccountAddress.fromProto(tokenHolder.address.account));
        // Add other token holder types here as needed
        case undefined:
            return null;
    }
}

/**
 * Convert token holder into its protobuf encoding.
 * @param {Type} tokenHolder The token holder.
 * @returns {Proto.TokenHolder} The protobuf encoding.
 */
export function toProto(tokenHolder: Type): Proto.TokenHolder {
    return {
        address: {
            oneofKind: 'account',
            account: AccountAddress.toProto(tokenHolder.address),
        },
    };
}
