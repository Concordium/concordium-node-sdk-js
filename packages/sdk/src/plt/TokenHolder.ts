import type * as Proto from '../grpc-api/v2/concordium/protocol-level-tokens.js';
import { Upward } from '../grpc/index.js';
import { Base58String } from '../index.js';
import { AccountAddress } from '../types/index.js';

interface TokenHolder<T extends string> {
    type: T;
}

type TokenHolderAccountJSON = TokenHolder<'account'> & {
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

    public toJSON(): TokenHolderAccountJSON {
        return {
            type: 'account',
            address: this.address.toJSON(),
        };
    }
}

export type Account = TokenHolderAccount;
export type AccountJSON = TokenHolderAccountJSON;

export type Type = Account; // Can be extended to include other token holder types in the future
export type JSON = AccountJSON; // Can be extended to include other token holder types in the future

export function fromAccountAddress(address: AccountAddress.Type): TokenHolderAccount {
    return new TokenHolderAccount(address);
}

export function fromJSON(json: AccountJSON): Account;
export function fromJSON(json: JSON): Upward<Type>;
export function fromJSON(json: JSON): Upward<Type> {
    switch (json.type) {
        case 'account':
            return new TokenHolderAccount(AccountAddress.fromJSON(json.address));
        default:
            return null;
    }
}

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
