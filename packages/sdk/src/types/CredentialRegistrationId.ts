import { Buffer } from 'buffer/index.js';

import { HexString } from '../types.js';
import { isHex } from '../util.js';
import { TypedJson, TypedJsonDiscriminator, makeFromTypedJson } from './util.js';

/**
 * The {@linkcode TypedJsonDiscriminator} discriminator associated with {@linkcode Type} type.
 * @deprecated
 */
export const JSON_DISCRIMINATOR = TypedJsonDiscriminator.CredentialRegistrationId;
/**
 * @deprecated
 */
export type Serializable = string;

/**
 * Representation of a credential registration id, which enforces that it:
 * - Is a valid Hex string
 * - Has length exactly 96, because a credId is 48 bytes.
 * - Checks the first bit is 1, which indicates that the value represents a compressed BLS12-381 curve point.
 */
class CredentialRegistrationId {
    /** Having a private field prevents similar structured objects to be considered the same type (similar to nominal typing). */
    private __type = JSON_DISCRIMINATOR;
    constructor(
        /** Representation of a credential registration id */
        public readonly credId: string
    ) {}

    /**
     * Get a string representation of the credential registration id.
     * @returns {string} The string representation.
     */
    public toString(): string {
        return this.credId;
    }

    /**
     * Get a JSON-serializable representation of the credential registration id.
     * @returns {string} The JSON-serializable representation.
     */
    public toJSON(): string {
        return this.credId;
    }
}

/**
 * Converts a `string` to a credential registration id.
 * @param {string} json The JSON representation of the credential registration id.
 * @throws If the provided input is: not a valid hex string, not of exactly 96 characters, the first bit is not 1.
 * @returns {CredentialRegistrationId} The credential registration id.
 */
export function fromJSON(json: string): CredentialRegistrationId {
    return fromHexString(json);
}

/**
 * Representation of a credential registration id, which enforces that it:
 * - Is a valid Hex string
 * - Has length exactly 96, because a credId is 48 bytes.
 * - Checks the first bit is 1, which indicates that the value represents a compressed BLS12-381 curve point.
 */
export type Type = CredentialRegistrationId;

/**
 * Type predicate for {@linkcode Type}
 *
 * @param value value to check.
 * @returns whether `value` is of type {@linkcode Type}
 */
export function instanceOf(value: unknown): value is CredentialRegistrationId {
    return value instanceof CredentialRegistrationId;
}

/**
 * Construct a CredentialRegistrationId from a hex string.
 * @param {HexString} credId The hex encoding of the credential registration id.
 * @throws If the provided input is: not a valid hex string, not of exactly 96 characters, the first bit is not 1.
 * @returns {CredentialRegistrationId}
 */
export function fromHexString(credId: HexString): CredentialRegistrationId {
    if (credId.length !== 96) {
        throw new Error('The provided credId ' + credId + ' is invalid as its length was not 96');
    }
    if (!isHex(credId)) {
        throw new Error('The provided credId ' + credId + ' does not represent a hexidecimal value');
    }
    // Check that the first bit is 1
    if ((parseInt(credId.substring(0, 2), 16) & 0b10000000) === 0) {
        throw new Error('The provided credId ' + credId + 'does not represent a compressed BLS12-381 point');
    }
    return new CredentialRegistrationId(credId);
}

/**
 * Get the hex string representation of the credential registatration ID.
 * @param {CredentialRegistrationId} cred The credential registration ID.
 * @returns {HexString} The hex encoding.
 */
export function toHexString(cred: CredentialRegistrationId): HexString {
    return cred.credId;
}

/**
 * Get the byte representation of the credential registatration ID.
 * @param {CredentialRegistrationId} cred The credential registration ID.
 * @returns {Uint8Array} Buffer with byte representation.
 */
export function toBuffer(cred: CredentialRegistrationId): Uint8Array {
    return Buffer.from(cred.credId, 'hex');
}

/**
 * Takes an {@linkcode Type} and transforms it to a {@linkcode TypedJson} format.
 * @deprecated Use the {@linkcode CredentialRegistrationId.toJSON} method instead.
 * @param {Type} value - The account address instance to transform.
 * @returns {TypedJson} The transformed object.
 */
export function toTypedJSON(value: CredentialRegistrationId): TypedJson<Serializable> {
    return {
        ['@type']: JSON_DISCRIMINATOR,
        value: toHexString(value),
    };
}

/**
 * Takes a {@linkcode TypedJson} object and converts it to instance of type {@linkcode Type}.
 * @deprecated Use the {@linkcode fromJSON} function instead.
 * @param {TypedJson} json - The typed JSON to convert.
 * @throws {TypedJsonParseError} - If unexpected JSON string is passed.
 * @returns {Type} The parsed instance.
 */
export const fromTypedJSON = /*#__PURE__*/ makeFromTypedJson(JSON_DISCRIMINATOR, fromHexString);
