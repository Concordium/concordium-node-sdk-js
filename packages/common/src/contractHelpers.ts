import { Buffer } from 'buffer/';
import { ContractAddress, InstanceInfo } from './types';

const CONTRACT_PARAM_MAX_LENGTH = 1024;

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
