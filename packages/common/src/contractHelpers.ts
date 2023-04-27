import { InstanceInfo } from './types';

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
