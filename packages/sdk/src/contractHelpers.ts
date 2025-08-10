import type * as ContractAddress from './types/ContractAddress.js';

const CONTRACT_PARAM_MAX_LENGTH = 65535;

/**
 * Checks if a buffer is larger than what is accepted for smart contract parameters
 *
 * @param {Buffer} buffer - The buffer to check
 *
 * @returns {void} nothing.
 *
 * @throws If buffer exceeds max length allowed for smart contract parameters
 */
export const checkParameterLength = (buffer: ArrayBuffer): void => {
    if (buffer.byteLength > CONTRACT_PARAM_MAX_LENGTH) {
        throw new Error(
            `Serialized parameter exceeds max length of smart contract parameter (${CONTRACT_PARAM_MAX_LENGTH} bytes)`
        );
    }
};

/**
 * Whether two {@link ContractAddress} contract addresses are equal.
 */
export const isEqualContractAddress =
    (a: ContractAddress.Type) =>
    (b: ContractAddress.Type): boolean =>
        a.index === b.index && a.subindex === b.subindex;

/** The name of a smart contract. Note: This does _not_ including the 'init_' prefix. */
export type ContractName = string;
/** The name of an entrypoint exposed by a smart contract. Note: This does _not_ include the '<contractName>.' prefix. */
export type EntrypointName = string;

/** Check that every character is an Ascii alpha, numeric or punctuation. */
export function isAsciiAlphaNumericPunctuation(string: string): boolean {
    for (let i = 0; i < string.length; i++) {
        const charCode = string.charCodeAt(i);
        if (
            (32 <= charCode && charCode <= 47) || // Punctuation ! to /
            (48 <= charCode && charCode <= 57) || // Numeric
            (58 <= charCode && charCode <= 64) || // Punctuation : to @
            (65 <= charCode && charCode <= 90) || // Uppercase alpha
            (91 <= charCode && charCode <= 96) || // Punctuation [ to `
            (97 <= charCode && charCode <= 122) || // Lowercase alpha
            (123 <= charCode && charCode <= 126) // Punctuation { to ~
        ) {
            continue;
        } else {
            return false;
        }
    }
    return true;
}

/** Check if a string is a valid smart contract init name. */
export function isInitName(string: string): boolean {
    return (
        string.length <= 100 &&
        string.startsWith('init_') &&
        !string.includes('.') &&
        isAsciiAlphaNumericPunctuation(string)
    );
}

/** Get the contract name from a string. Assumes the string is a valid init name. */
export function getContractNameFromInit(initName: string): ContractName {
    return initName.substring(5);
}

/** Check if a string is a valid smart contract receive name. */
export function isReceiveName(string: string): boolean {
    return string.length <= 100 && string.includes('.') && isAsciiAlphaNumericPunctuation(string);
}

/** Get the contract name and entrypoint name from a string. Assumes the string is a valid receive name. */
export function getNamesFromReceive(receiveName: string): {
    contractName: ContractName;
    entrypointName: EntrypointName;
} {
    const splitPoint = receiveName.indexOf('.');
    if (splitPoint === -1) {
        throw new Error('Invalid receive name');
    }
    return {
        contractName: receiveName.substring(0, splitPoint),
        entrypointName: receiveName.substring(splitPoint + 1),
    };
}

/**
 * Get contract update payload size by adding reserved offsets to parameter size and receive name size
 * Amount (8 bytes), Contract address (16 bytes), Receive name size (2 bytes), Parameter size (2 bytes)
 */
export function getUpdatePayloadSize(parameterSize: number, receiveNameLength: number): bigint {
    return 8n + 16n + 2n + BigInt(parameterSize) + 2n + BigInt(receiveNameLength);
}
