import { Buffer } from 'buffer/';
import { ContractAddress, InstanceInfo } from './types';

const CONTRACT_PARAM_MAX_LENGTH = 65535;

/**
 * Gets the contract name from an {@link InstanceInfo} object.
 *
 * @throws If name is not structured as expected
 */
export const getContractName = ({ name }: InstanceInfo): string => {
    if (!name.startsWith('init_')) {
        throw new Error('Could not get name from contract instance info.');
    }

    return name.substring(5);
};

/**
 * Checks if a buffer is larger than what is accepted for smart contract parameters
 *
 * @param {Buffer} buffer - The buffer to check
 *
 * @returns {void} nothing.
 *
 * @throws If buffer exceeds max length allowed for smart contract parameters
 */
export const checkParameterLength = (buffer: Buffer): void => {
    if (buffer.length > CONTRACT_PARAM_MAX_LENGTH) {
        throw new Error(
            `Serialized parameter exceeds max length of smart contract parameter (${CONTRACT_PARAM_MAX_LENGTH} bytes)`
        );
    }
};

/**
 * Whether two {@link ContractAddress} contract addresses are equal.
 */
export const isEqualContractAddress =
    (a: ContractAddress) =>
    (b: ContractAddress): boolean =>
        a.index === b.index && a.subindex === b.subindex;

/** The name of a smart contract. Note: This does _not_ including the 'init_' prefix. */
export type ContractName = string;
/** The name of a receive function exposed in a smart contract module. Note: This is of the form '<contractName>.<entrypointName>'. */
export type ReceiveName = string;
/** The name of an init function exposed in a smart contract module. Note: This is of the form 'init_<contractName>'. */
export type InitName = string;
/** The name of an entrypoint exposed by a smart contract. Note: This does _not_ include the '<contractName>.' prefix. */
export type EntrypointName = string;

/** Check that every character is an Ascii alpha, numeric or punctuation. */
function isAsciiAlphaNumericPunctuation(string: string) {
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
export function isInitName(string: string): string is InitName {
    return (
        string.length <= 100 &&
        string.startsWith('init_') &&
        !string.includes('.') &&
        isAsciiAlphaNumericPunctuation(string)
    );
}

/** Get the contract name from a string. Assumes the string is a valid init name. */
export function getContractNameFromInit(initName: InitName): ContractName {
    return initName.substring(5);
}

/** Check if a string is a valid smart contract receive name. */
export function isReceiveName(string: string): string is ReceiveName {
    return (
        string.length <= 100 &&
        string.includes('.') &&
        isAsciiAlphaNumericPunctuation(string)
    );
}

/** Get the contract name and entrypoint name from a string. Assumes the string is a valid receive name. */
export function getNamesFromReceive(receiveName: ReceiveName): {
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
