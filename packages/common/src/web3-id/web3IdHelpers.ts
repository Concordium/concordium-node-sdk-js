import { CryptographicParameters } from '../types.js';
import type * as ContractAddress from '../types/ContractAddress.js';
import {
    AttributeType,
    StatementAttributeType,
    TimestampAttribute,
} from './web3IdProofTypes.js';

export type VerifyWeb3IdCredentialSignatureInput = {
    globalContext: CryptographicParameters;
    signature: string;
    values: Record<string, AttributeType>;
    randomness: Record<string, string>;
    holder: string;
    issuerPublicKey: string;
    issuerContract: ContractAddress.Type;
};

/**
 * Compares a and b as field elements.
 * if a < b then compareStringAttributes(a,b) = -1;
 * if a == b then compareStringAttributes(a,b) = 0;
 * if a > b then compareStringAttributes(a,b) = 1;
 */
export function compareStringAttributes(a: string, b: string): number {
    const encoder = new TextEncoder();
    const aBytes = encoder.encode(a);
    const bBytes = encoder.encode(b);

    if (aBytes.length < bBytes.length) return -1;
    if (aBytes.length > bBytes.length) return 1;

    for (const [i, aByte] of aBytes.entries()) {
        const bByte = bBytes[i];

        if (aByte === bBytes[i]) continue;
        return aByte < bByte ? -1 : 1;
    }

    return 0;
}

/**
 * Given a string attribute value and a range [lower, upper[, return whether value is in the range, when converted into field elements.
 */
export function isStringAttributeInRange(
    value: string,
    lower: string,
    upper: string
): boolean {
    const lowCmp = compareStringAttributes(value, lower);
    if (lowCmp < 0) {
        return false;
    }
    const upCmp = compareStringAttributes(value, upper);
    return upCmp < 0;
}

/**
 * Converts a timestamp attribute to a Date.
 * @param attribute the timestamp attribute
 * @returns a Date representing the timestamp
 */
export function timestampToDate(attribute: TimestampAttribute): Date {
    return new Date(Date.parse(attribute.timestamp));
}

/**
 * Converts a Date to a timestamp attribute.
 * @param value the date to convert to an attribute
 * @returns the timestamp attribute for the provided date
 */
export function dateToTimestampAttribute(value: Date): TimestampAttribute {
    return {
        type: 'date-time',
        timestamp: value.toISOString(),
    };
}

/**
 * Converts a statement attribute to an attribute. Statement attributes allow
 * for Date which are mapped into timestamp attributes. All other attribute
 * types are mapped one-to-one.
 * @param statementAttribute the statement attribute to map
 * @returns the mapped attribute type
 */
export function statementAttributeTypeToAttributeType(
    statementAttribute: StatementAttributeType
): AttributeType {
    if (statementAttribute instanceof Date) {
        return dateToTimestampAttribute(statementAttribute);
    }
    return statementAttribute;
}
